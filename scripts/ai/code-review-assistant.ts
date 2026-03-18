#!/usr/bin/env tsx

import { program } from 'commander'
import { CodeReviewAgent } from '@agency/ai-automation'
import winston from 'winston'

// ============================================================================
// Code Review Assistant CLI
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
})

program
  .name('code-review-assistant')
  .description('AI-assisted code review CLI')
  .version('1.0.0')

// Review Pull Request Command
program
  .command('review-pr')
  .description('Review a pull request using AI')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .requiredOption('--pr <pr>', 'Pull request number')
  .option('--output <output>', 'Output format (json|markdown)', 'markdown')
  .option('--save <file>', 'Save review to file')
  .action(async (options) => {
    try {
      const agent = new CodeReviewAgent({
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        reviewRules: getDefaultReviewRules(),
        severityThresholds: {
          security: 'medium',
          performance: 'medium',
          maintainability: 'low'
        },
        multiRepoAnalysis: true,
        automatedFixes: true,
        complianceFrameworks: ['SOC2', 'GDPR']
      })

      // Mock PR data - in production, fetch from GitHub API
      const mockContext = createMockReviewContext(options.owner, options.repo, options.pr)
      
      const analysis = await agent.reviewCode(mockContext)
      
      logger.info('Code review completed', {
        prNumber: options.pr,
        totalFindings: analysis.summary.totalFindings,
        riskScore: analysis.summary.riskScore
      })

      // Format output
      const output = formatReviewOutput(analysis, options.output)
      
      if (options.save) {
        require('fs').writeFileSync(options.save, output)
        logger.info(`Review saved to ${options.save}`)
      } else {
        console.log(output)
      }

    } catch (error) {
      logger.error('Failed to review pull request', { error })
      process.exit(1)
    }
  })

// Analyze File Command
program
  .command('analyze-file')
  .description('Analyze a single file for code quality')
  .requiredOption('--file <file>', 'File path to analyze')
  .option('--language <language>', 'Programming language', 'typescript')
  .option('--rules <rules>', 'Custom rules file (JSON)')
  .action(async (options) => {
    try {
      const agent = new CodeReviewAgent({
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        reviewRules: options.rules ? 
          JSON.parse(require('fs').readFileSync(options.rules, 'utf8')) :
          getDefaultReviewRules(),
        severityThresholds: {
          security: 'medium',
          performance: 'medium',
          maintainability: 'low'
        },
        multiRepoAnalysis: false,
        automatedFixes: true,
        complianceFrameworks: []
      })

      // Read file content
      const fileContent = require('fs').readFileSync(options.file, 'utf8')
      
      // Create mock context for single file
      const mockContext = createMockFileContext(options.file, fileContent, options.language)
      
      const analysis = await agent.reviewCode(mockContext)
      
      logger.info('File analysis completed', {
        file: options.file,
        totalFindings: analysis.summary.totalFindings,
        riskScore: analysis.summary.riskScore
      })

      const output = formatReviewOutput(analysis, 'markdown')
      console.log(output)

    } catch (error) {
      logger.error('Failed to analyze file', { error })
      process.exit(1)
    }
  })

// List Rules Command
program
  .command('list-rules')
  .description('List available review rules')
  .option('--type <type>', 'Filter by rule type')
  .option('--severity <severity>', 'Filter by severity')
  .action(async (options) => {
    try {
      const agent = new CodeReviewAgent({
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        reviewRules: getDefaultReviewRules(),
        severityThresholds: {
          security: 'medium',
          performance: 'medium',
          maintainability: 'low'
        },
        multiRepoAnalysis: true,
        automatedFixes: true,
        complianceFrameworks: []
      })

      const rules = agent.getRules()
      
      let filteredRules = rules
      
      if (options.type) {
        filteredRules = filteredRules.filter(rule => rule.type === options.type)
      }
      
      if (options.severity) {
        filteredRules = filteredRules.filter(rule => rule.severity === options.severity)
      }

      console.log('=== Code Review Rules ===')
      console.log(`Total rules: ${filteredRules.length}`)
      console.log()

      filteredRules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.name}`)
        console.log(`   ID: ${rule.id}`)
        console.log(`   Type: ${rule.type}`)
        console.log(`   Severity: ${rule.severity}`)
        console.log(`   Enabled: ${rule.enabled}`)
        console.log(`   Description: ${rule.description}`)
        if (rule.automatedFix) {
          console.log(`   Automated Fix: ${rule.automatedFix.description}`)
        }
        console.log()
      })

    } catch (error) {
      logger.error('Failed to list rules', { error })
      process.exit(1)
    }
  })

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultReviewRules() {
  return [
    {
      id: 'security-hardcoded-secrets',
      name: 'Hardcoded Secrets',
      description: 'Detect hardcoded secrets, API keys, or passwords',
      type: 'security' as const,
      severity: 'critical' as const,
      pattern: /(password|secret|key|token)\s*=\s*['"`][^'"`]+['"`]/i,
      enabled: true,
      automatedFix: {
        description: 'Move secret to environment variables',
        template: 'process.env.SECRET_NAME',
        confidence: 0.8
      }
    },
    {
      id: 'performance-inefficient-loop',
      name: 'Inefficient Loop',
      description: 'Detect inefficient nested loops or O(n²) operations',
      type: 'performance' as const,
      severity: 'medium' as const,
      pattern: /for\s*\([^)]*\)\s*\{\s*for\s*\([^)]*\)/,
      enabled: true
    },
    {
      id: 'maintainability-long-function',
      name: 'Long Function',
      description: 'Detect functions that are too long',
      type: 'maintainability' as const,
      severity: 'low' as const,
      pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]{1000,}/,
      enabled: true
    },
    {
      id: 'style-unused-import',
      name: 'Unused Import',
      description: 'Detect unused import statements',
      type: 'style' as const,
      severity: 'low' as const,
      pattern: /^import\s+.*?from\s+['"][^'"]+['"];?$/gm,
      enabled: true
    }
  ]
}

function createMockReviewContext(owner: string, repo: string, prNumber: number) {
  return {
    pullRequest: {
      number: prNumber,
      title: 'Feature: Add new AI automation capabilities',
      description: 'This PR adds advanced AI automation features to the repository',
      author: 'ai-assistant',
      baseBranch: 'main',
      headBranch: 'feature/ai-automation',
      files: [
        {
          path: 'packages/ai-automation/src/index.ts',
          additions: 150,
          deletions: 10,
          patch: `@@ -1,10 +1,160 @@
 // Main exports
 export * from './types'
 export * from './orchestration'
+export * from './automation'
+export * from './cicd'
+export * from './review'
 
 // Version
 export const VERSION = '0.1.0'
+
+// Advanced AI automation features
+export class AIAutomationSystem {
+  constructor(private config: AIAutomationConfig) {}
+  
+  async executeWorkflow(workflowId: string, input: any) {
+    // Implementation here
+  }
+}
+
+interface AIAutomationConfig {
+  providers: AIProvider[]
+  governance: GovernanceConfig
+  monitoring: MonitoringConfig
+}`
        },
        {
          path: 'packages/ai-automation/src/automation/repository-agent.ts',
          additions: 300,
          deletions: 5,
          patch: `@@ -50,6 +50,15 @@
 export class RepositoryAgent {
   private config: RepositoryAgentConfig
   private octokit: Octokit
+  private aiProvider: AIProvider
+  private logger: winston.Logger
+
+  constructor(config: RepositoryAgentConfig) {
+    this.config = config
+    this.octokit = new Octokit({ auth: config.githubToken })
+    this.aiProvider = this.createAIProvider(config.aiProvider)
+  }
+
+  async createPullRequest(context: RepositoryContext, operation: RepositoryOperation) {
+    // AI-powered PR creation
+  }`
        }
      ]
    },
    repository: {
      owner,
      repo,
      branch: 'main',
      commitSha: 'abc123def456',
      metadata: {
        language: 'TypeScript',
        framework: 'Node.js',
        dependencies: {
          'typescript': '^5.0.0',
          'octokit': '^20.0.0',
          'zod': '^3.22.0'
        },
        size: 'medium'
      }
    },
    metadata: {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['Node.js'],
      complexity: 'medium',
      riskLevel: 'medium'
    }
  }
}

function createMockFileContext(filePath: string, content: string, language: string) {
  return {
    pullRequest: {
      number: 1,
      title: 'Single file analysis',
      description: 'Analyze single file',
      author: 'developer',
      baseBranch: 'main',
      headBranch: 'feature',
      files: [
        {
          path: filePath,
          additions: content.split('\n').length,
          deletions: 0,
          patch: `@@ -1,0 +1,${content.split('\n').length} @@
${content.split('\n').map((line, i) => `+${line}`).join('\n')}`
        }
      ]
    },
    repository: {
      owner: 'test',
      repo: 'test-repo',
      branch: 'main',
      commitSha: 'abc123',
      metadata: {
        language,
        framework: language === 'typescript' ? 'Node.js' : undefined,
        dependencies: {},
        size: 'small'
      }
    },
    metadata: {
      languages: [language],
      frameworks: language === 'typescript' ? ['Node.js'] : [],
      complexity: 'low',
      riskLevel: 'low'
    }
  }
}

function formatReviewOutput(analysis: any, format: 'json' | 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(analysis, null, 2)
  }

  // Markdown format
  let output = `# Code Review Analysis\n\n`
  
  output += `## Summary\n\n`
  output += `- **Total Findings**: ${analysis.summary.totalFindings}\n`
  output += `- **Risk Score**: ${analysis.summary.riskScore}/100\n`
  output += `- **Files Analyzed**: ${analysis.metadata.filesAnalyzed}\n`
  output += `- **Lines Analyzed**: ${analysis.metadata.linesAnalyzed}\n`
  output += `- **Confidence**: ${(analysis.metadata.confidence * 100).toFixed(1)}%\n\n`

  if (analysis.summary.bySeverity && Object.keys(analysis.summary.bySeverity).length > 0) {
    output += `### Findings by Severity\n\n`
    Object.entries(analysis.summary.bySeverity).forEach(([severity, count]) => {
      output += `- **${severity.charAt(0).toUpperCase() + severity.slice(1)}**: ${count}\n`
    })
    output += '\n'
  }

  if (analysis.findings.length > 0) {
    output += `## Findings\n\n`
    
    analysis.findings.forEach((finding: any, index: number) => {
      output += `### ${index + 1}. ${finding.title}\n\n`
      output += `- **Type**: ${finding.type}\n`
      output += `- **Severity**: ${finding.severity}\n`
      output += `- **File**: ${finding.location.file}\n`
      if (finding.location.line) {
        output += `- **Line**: ${finding.location.line}\n`
      }
      output += `- **Description**: ${finding.description}\n`
      
      if (finding.suggestion) {
        output += `- **Suggestion**: ${finding.suggestion}\n`
      }
      
      if (finding.automatedFix) {
        output += `- **Automated Fix Available**: Yes (${(finding.automatedFix.confidence * 100).toFixed(1)}% confidence)\n`
      }
      
      output += '\n'
    })
  }

  if (analysis.recommendations.length > 0) {
    output += `## Recommendations\n\n`
    analysis.recommendations.forEach((rec: string, index: number) => {
      output += `${index + 1}. ${rec}\n`
    })
    output += '\n'
  }

  output += `---\n`
  output += `*Generated by AI Code Review Assistant*\n`

  return output
}

// Parse command line arguments
program.parse()
