import { Octokit } from '@octokit/rest'
import { z } from 'zod'
import winston from 'winston'
import {
  AgentConfiguration,
  RepositoryOperation,
  RepositoryContext,
  AIRequest,
  AIResponse,
  StructuredOutputSchema,
  AIAutomationError,
  ErrorCodeSchema
} from '../types'

// ============================================================================
// Repository Automation Agent
// ============================================================================

export interface RepositoryAgentConfig {
  githubToken: string
  defaultOwner: string
  aiProvider: {
    provider: 'openai' | 'anthropic'
    model: string
    apiKey: string
  }
  restrictions: {
    maxFilesPerOperation: number
    requireApprovalForDestructiveOps: boolean
    forbiddenBranches: string[]
  }
}

export class RepositoryAgent {
  private config: RepositoryAgentConfig
  private octokit: Octokit
  private logger: winston.Logger
  private aiProvider: AIProvider

  constructor(config: RepositoryAgentConfig) {
    this.config = config
    this.octokit = new Octokit({ auth: config.githubToken })
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'repository-agent.log' })
      ]
    })

    this.aiProvider = this.createAIProvider(config.aiProvider)
  }

  // ============================================================================
  // Repository Operations
  // ============================================================================

  /**
   * Create a pull request with AI-generated content
   */
  async createPullRequest(
    context: RepositoryContext,
    operation: RepositoryOperation & { type: 'create-pr' }
  ): Promise<{ url: string; number: number }> {
    this.logger.info('Creating pull request', { context, operation })

    // Validate operation
    this.validateOperation(operation)

    // Generate PR content using AI
    const prContent = await this.generatePRContent(context, operation)

    // Create the pull request
    const pr = await this.octokit.pulls.create({
      owner: context.owner,
      repo: context.repo,
      title: operation.parameters.title as string,
      head: operation.parameters.head as string,
      base: operation.parameters.base as string,
      body: prContent.body,
      draft: operation.parameters.draft as boolean || false
    })

    this.logger.info('Pull request created', { 
      url: pr.data.html_url, 
      number: pr.data.number 
    })

    return {
      url: pr.data.html_url,
      number: pr.data.number
    }
  }

  /**
   * Update files in a repository
   */
  async updateFiles(
    context: RepositoryContext,
    operation: RepositoryOperation & { type: 'update-file' }
  ): Promise<{ commitSha: string; updatedFiles: string[] }> {
    this.logger.info('Updating files', { context, operation })

    this.validateOperation(operation)

    const files = operation.parameters.files as Array<{
      path: string
      content: string
      mode?: '100644' | '100755' | '040000'
    }>

    if (files.length > this.config.restrictions.maxFilesPerOperation) {
      throw new AIAutomationError(
        'TOO_MANY_FILES',
        `Operation exceeds maximum files limit: ${files.length} > ${this.config.restrictions.maxFilesPerOperation}`
      )
    }

    // Get current branch info
    const { data: ref } = await this.octokit.git.getRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${context.branch}`
    })

    // Create tree with updated files
    const tree = await this.createTree(context, files, ref.object.sha)

    // Create commit
    const commit = await this.octokit.git.createCommit({
      owner: context.owner,
      repo: context.repo,
      message: operation.parameters.commitMessage as string,
      tree: tree.sha,
      parents: [ref.object.sha]
    })

    // Update branch reference
    await this.octokit.git.updateRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${context.branch}`,
      sha: commit.sha
    })

    this.logger.info('Files updated', { 
      commitSha: commit.sha,
      updatedFiles: files.map(f => f.path)
    })

    return {
      commitSha: commit.sha,
      updatedFiles: files.map(f => f.path)
    }
  }

  /**
   * Analyze repository context
   */
  async analyzeRepository(context: RepositoryContext): Promise<RepositoryContext> {
    this.logger.info('Analyzing repository', { context })

    // Get repository information
    const { data: repo } = await this.octokit.repos.get({
      owner: context.owner,
      repo: context.repo
    })

    // Get language information
    const { data: languages } = await this.octokit.repos.listLanguages({
      owner: context.owner,
      repo: context.repo
    })

    // Get package.json if it exists
    let dependencies: Record<string, string> = {}
    try {
      const { data: packageJson } = await this.octokit.repos.getContent({
        owner: context.owner,
        repo: context.repo,
        path: 'package.json'
      })

      if ('content' in packageJson && packageJson.content) {
        const content = Buffer.from(packageJson.content, 'base64').toString()
        const pkg = JSON.parse(content)
        dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
      }
    } catch (error) {
      // package.json not found or not accessible
      this.logger.debug('No package.json found', { error })
    }

    // Determine repository size
    const size = repo.size < 1000 ? 'small' : repo.size < 10000 ? 'medium' : 'large'

    return {
      ...context,
      metadata: {
        language: repo.language || 'unknown',
        framework: this.detectFramework(dependencies),
        dependencies,
        size
      }
    }
  }

  // ============================================================================
  // AI-Powered Operations
  // ============================================================================

  private async generatePRContent(
    context: RepositoryContext,
    operation: RepositoryOperation & { type: 'create-pr' }
  ): Promise<{ title: string; body: string }> {
    const prompt = this.buildPRContentPrompt(context, operation)
    
    const schema: StructuredOutputSchema = {
      name: 'pr_content',
      schema: z.object({
        title: z.string().describe('PR title'),
        body: z.string().describe('PR description in markdown format'),
        summary: z.string().describe('Brief summary of changes'),
        testing: z.string().describe('Testing information'),
        breaking: z.boolean().describe('Whether this contains breaking changes')
      }),
      description: 'Pull request content structure'
    }

    const response = await this.aiProvider.generate({
      prompt,
      structuredOutput: schema,
      systemPrompt: 'You are an expert software engineer creating clear, informative pull requests. Always follow the provided structure and be concise but thorough.'
    })

    if (!response.structuredData) {
      throw new AIAutomationError(
        'AI_PROVIDER_ERROR',
        'Failed to generate structured PR content'
      )
    }

    const data = response.structuredData as any
    
    return {
      title: data.title || operation.parameters.title as string,
      body: this.formatPRBody(data)
    }
  }

  private buildPRContentPrompt(
    context: RepositoryContext,
    operation: RepositoryOperation & { type: 'create-pr' }
  ): string {
    return `
Generate a comprehensive pull request description for the following operation:

Repository: ${context.owner}/${context.repo}
Base Branch: ${operation.parameters.base}
Head Branch: ${operation.parameters.head}

Operation Details:
${JSON.stringify(operation.parameters, null, 2)}

Repository Context:
- Language: ${context.metadata.language}
- Framework: ${context.metadata.framework}
- Size: ${context.metadata.size}

Please create a professional PR description that includes:
1. Clear title
2. Detailed description of changes
3. Summary of what was changed
4. Testing information
5. Whether this contains breaking changes

The description should be in markdown format and follow best practices for pull requests.
`
  }

  private formatPRBody(data: any): string {
    return `
## Summary
${data.summary}

## Changes
${data.testing}

## Testing
${data.testing}

${data.breaking ? '⚠️ **Breaking Changes**' : '✅ **No Breaking Changes**}

---
*This PR was created with AI assistance*
`
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async createTree(
    context: RepositoryContext,
    files: Array<{ path: string; content: string; mode?: string }>,
    baseSha: string
  ): Promise<{ sha: string }> {
    const treeItems = files.map(file => ({
      path: file.path,
      mode: file.mode || '100644' as const,
      type: 'blob' as const,
      content: file.content
    }))

    const { data: tree } = await this.octokit.git.createTree({
      owner: context.owner,
      repo: context.repo,
      tree: treeItems,
      base_tree: baseSha
    })

    return tree
  }

  private detectFramework(dependencies: Record<string, string>): string | undefined {
    const frameworks = {
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'express': 'Express.js',
      'fastify': 'Fastify',
      'nestjs': 'NestJS',
      'django': 'Django',
      'flask': 'Flask',
      'rails': 'Ruby on Rails'
    }

    for (const [dep, framework] of Object.entries(frameworks)) {
      if (dependencies[dep]) {
        return framework
      }
    }

    return undefined
  }

  private validateOperation(operation: RepositoryOperation): void {
    if (!operation.parameters) {
      throw new AIAutomationError(
        'VALIDATION_ERROR',
        'Operation parameters are required'
      )
    }

    // Check for forbidden branches
    if (operation.type === 'update-file' && operation.parameters.branch) {
      const branch = operation.parameters.branch as string
      if (this.config.restrictions.forbiddenBranches.includes(branch)) {
        throw new AIAutomationError(
          'FORBIDDEN_BRANCH',
          `Operation not allowed on branch: ${branch}`
        )
      }
    }

    // Check approval requirements for destructive operations
    if (this.config.restrictions.requireApprovalForDestructiveOps) {
      const destructiveOps = ['delete-branch', 'force-push', 'delete-tag']
      if (destructiveOps.includes(operation.type)) {
        throw new AIAutomationError(
          'APPROVAL_REQUIRED',
          `Destructive operation requires approval: ${operation.type}`
        )
      }
    }
  }

  private createAIProvider(config: RepositoryAgentConfig['aiProvider']): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config)
      case 'anthropic':
        return new AnthropicProvider(config)
      default:
        throw new AIAutomationError(
          'UNSUPPORTED_PROVIDER',
          `AI provider not supported: ${config.provider}`
        )
    }
  }
}

// ============================================================================
// AI Provider Interface and Implementations
// ============================================================================

export interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>
}

export class OpenAIProvider implements AIProvider {
  private config: RepositoryAgentConfig['aiProvider']

  constructor(config: RepositoryAgentConfig['aiProvider']) {
    this.config = config
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Mock implementation - in production, use actual OpenAI API
    return {
      content: 'Generated content from OpenAI',
      structuredData: request.structuredOutput ? {
        title: 'AI Generated Title',
        body: 'AI Generated Body',
        summary: 'AI Generated Summary',
        testing: 'Tests added',
        breaking: false
      } : undefined,
      metadata: {
        model: this.config.model,
        tokensUsed: { prompt: 100, completion: 200, total: 300 },
        cost: 0.006,
        latency: 1500
      }
    }
  }
}

export class AnthropicProvider implements AIProvider {
  private config: RepositoryAgentConfig['aiProvider']

  constructor(config: RepositoryAgentConfig['aiProvider']) {
    this.config = config
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Mock implementation - in production, use actual Anthropic API
    return {
      content: 'Generated content from Anthropic',
      structuredData: request.structuredOutput ? {
        title: 'Claude Generated Title',
        body: 'Claude Generated Body',
        summary: 'Claude Generated Summary',
        testing: 'Comprehensive tests added',
        breaking: false
      } : undefined,
      metadata: {
        model: this.config.model,
        tokensUsed: { prompt: 120, completion: 180, total: 300 },
        cost: 0.008,
        latency: 1200
      }
    }
  }
}
