#!/usr/bin/env tsx

import { program } from 'commander'
import { RepositoryAgent } from '@agency/ai-automation'
import winston from 'winston'

// ============================================================================
// Repository Automation CLI
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
  .name('repository-automation')
  .description('AI-powered repository automation CLI')
  .version('1.0.0')

// Create Pull Request Command
program
  .command('create-pr')
  .description('Create a pull request using AI')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .requiredOption('--head <head>', 'Head branch')
  .requiredOption('--base <base>', 'Base branch')
  .option('--title <title>', 'PR title')
  .option('--draft', 'Create as draft PR', false)
  .action(async (options) => {
    try {
      const agent = new RepositoryAgent({
        githubToken: process.env.GITHUB_TOKEN!,
        defaultOwner: options.owner,
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        restrictions: {
          maxFilesPerOperation: 50,
          requireApprovalForDestructiveOps: true,
          forbiddenBranches: ['main', 'master', 'production']
        }
      })

      const result = await agent.createPullRequest(
        {
          owner: options.owner,
          repo: options.repo,
          branch: options.head,
          commitSha: 'auto-generated',
          metadata: {
            language: 'TypeScript',
            dependencies: {},
            size: 'medium'
          }
        },
        {
          type: 'create-pr',
          parameters: {
            title: options.title || `AI-generated PR from ${options.head}`,
            head: options.head,
            base: options.base,
            draft: options.draft
          }
        }
      )

      logger.info('Pull request created successfully', { 
        url: result.url,
        number: result.number 
      })

    } catch (error) {
      logger.error('Failed to create pull request', { error })
      process.exit(1)
    }
  })

// Update Files Command
program
  .command('update-files')
  .description('Update files in repository using AI')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .requiredOption('--branch <branch>', 'Target branch')
  .requiredOption('--message <message>', 'Commit message')
  .option('--files <files>', 'JSON string of files to update')
  .action(async (options) => {
    try {
      const agent = new RepositoryAgent({
        githubToken: process.env.GITHUB_TOKEN!,
        defaultOwner: options.owner,
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        restrictions: {
          maxFilesPerOperation: 50,
          requireApprovalForDestructiveOps: true,
          forbiddenBranches: ['main', 'master', 'production']
        }
      })

      const files = options.files ? JSON.parse(options.files) : []

      const result = await agent.updateFiles(
        {
          owner: options.owner,
          repo: options.repo,
          branch: options.branch,
          commitSha: 'auto-generated',
          metadata: {
            language: 'TypeScript',
            dependencies: {},
            size: 'medium'
          }
        },
        {
          type: 'update-file',
          parameters: {
            files,
            commitMessage: options.message
          }
        }
      )

      logger.info('Files updated successfully', { 
        commitSha: result.commitSha,
        updatedFiles: result.updatedFiles 
      })

    } catch (error) {
      logger.error('Failed to update files', { error })
      process.exit(1)
    }
  })

// Analyze Repository Command
program
  .command('analyze')
  .description('Analyze repository structure and context')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .option('--branch <branch>', 'Branch to analyze', 'main')
  .action(async (options) => {
    try {
      const agent = new RepositoryAgent({
        githubToken: process.env.GITHUB_TOKEN!,
        defaultOwner: options.owner,
        aiProvider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!
        },
        restrictions: {
          maxFilesPerOperation: 50,
          requireApprovalForDestructiveOps: true,
          forbiddenBranches: ['main', 'master', 'production']
        }
      })

      const context = await agent.analyzeRepository({
        owner: options.owner,
        repo: options.repo,
        branch: options.branch,
        commitSha: 'auto-generated',
        metadata: {
          language: 'unknown',
          dependencies: {},
          size: 'medium'
        }
      })

      logger.info('Repository analysis completed', context)

    } catch (error) {
      logger.error('Failed to analyze repository', { error })
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()
