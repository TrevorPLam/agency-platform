#!/usr/bin/env tsx

import { program } from 'commander'
import { PipelineDoctor } from '@agency/ai-automation'
import winston from 'winston'

// ============================================================================
// Autonomous CI/CD CLI
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
  .name('autonomous-cicd')
  .description('Self-healing CI/CD pipeline automation CLI')
  .version('1.0.0')

// Analyze Failure Command
program
  .command('analyze-failure')
  .description('Analyze a pipeline failure and suggest healing actions')
  .requiredOption('--pipeline <pipeline>', 'Pipeline name')
  .requiredOption('--stage <stage>', 'Stage name')
  .requiredOption('--job <job>', 'Job name')
  .requiredOption('--error <error>', 'Error message')
  .option('--logs <logs>', 'Log file path or JSON array of logs')
  .option('--branch <branch>', 'Branch name', 'main')
  .option('--commit <commit>', 'Commit SHA')
  .action(async (options) => {
    try {
      const doctor = new PipelineDoctor({
        logAnalysisProvider: 'openai',
        healingStrategies: [],
        approvalRequired: ['fix-code', 'update-config'],
        maxHealingAttempts: 3,
        confidenceThreshold: 0.7
      })

      const logs = options.logs ? 
        (typeof options.logs === 'string' && options.logs.endsWith('.json') ? 
          require(options.logs) : 
          JSON.parse(options.logs)) : 
        [options.error]

      const failure = {
        id: `failure-${Date.now()}`,
        pipeline: options.pipeline,
        stage: options.stage,
        job: options.job,
        error: options.error,
        logs,
        metadata: {
          timestamp: new Date().toISOString(),
          branch: options.branch,
          commit: options.commit || 'unknown',
          runner: 'github-actions',
          duration: 0
        }
      }

      const analysis = await doctor.analyzeFailure(failure)
      
      logger.info('Failure analysis completed', {
        failureType: analysis.failureType,
        rootCause: analysis.rootCause,
        suggestedFixes: analysis.suggestedFixes.length,
        confidence: analysis.confidence
      })

      console.log('\n=== Analysis Results ===')
      console.log(`Failure Type: ${analysis.failureType}`)
      console.log(`Root Cause: ${analysis.rootCause}`)
      console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`)
      console.log('\nSuggested Actions:')
      analysis.suggestedFixes.forEach((action, index) => {
        console.log(`${index + 1}. ${action.description}`)
        console.log(`   Type: ${action.type}`)
        console.log(`   Automated: ${action.automated}`)
        console.log(`   Confidence: ${(action.confidence * 100).toFixed(1)}%`)
        console.log(`   Requires Approval: ${action.requiresApproval}`)
        console.log()
      })

    } catch (error) {
      logger.error('Failed to analyze failure', { error })
      process.exit(1)
    }
  })

// Heal Failure Command
program
  .command('heal-failure')
  .description('Attempt to heal a pipeline failure')
  .requiredOption('--pipeline <pipeline>', 'Pipeline name')
  .requiredOption('--stage <stage>', 'Stage name')
  .requiredOption('--job <job>', 'Job name')
  .requiredOption('--error <error>', 'Error message')
  .option('--logs <logs>', 'Log file path or JSON array of logs')
  .option('--branch <branch>', 'Branch name', 'main')
  .option('--commit <commit>', 'Commit SHA')
  .option('--auto', 'Execute healing automatically', false)
  .action(async (options) => {
    try {
      const doctor = new PipelineDoctor({
        logAnalysisProvider: 'openai',
        healingStrategies: [],
        approvalRequired: ['fix-code', 'update-config'],
        maxHealingAttempts: 3,
        confidenceThreshold: 0.7
      })

      const logs = options.logs ? 
        (typeof options.logs === 'string' && options.logs.endsWith('.json') ? 
          require(options.logs) : 
          JSON.parse(options.logs)) : 
        [options.error]

      const failure = {
        id: `failure-${Date.now()}`,
        pipeline: options.pipeline,
        stage: options.stage,
        job: options.job,
        error: options.error,
        logs,
        metadata: {
          timestamp: new Date().toISOString(),
          branch: options.branch,
          commit: options.commit || 'unknown',
          runner: 'github-actions',
          duration: 0
        }
      }

      // First analyze the failure
      const analysis = await doctor.analyzeFailure(failure)
      
      logger.info('Analysis completed', {
        failureType: analysis.failureType,
        suggestedFixes: analysis.suggestedFixes.length
      })

      if (!options.auto) {
        console.log('\n=== Proposed Healing Action ===')
        const action = analysis.suggestedFixes[0]
        if (action) {
          console.log(`Action: ${action.description}`)
          console.log(`Type: ${action.type}`)
          console.log(`Automated: ${action.automated}`)
          console.log(`Confidence: ${(action.confidence * 100).toFixed(1)}%`)
          console.log(`Requires Approval: ${action.requiresApproval}`)
          
          if (!action.automated || action.requiresApproval) {
            console.log('\n❌ This action requires manual intervention')
            process.exit(0)
          }

          console.log('\nProceed with healing? (y/N)')
          process.stdin.setRawMode(true)
          process.stdin.resume()
          process.stdin.setEncoding('utf8')

          for await (const key of process.stdin) {
            if (key === 'y' || key === 'Y') {
              break
            } else {
              console.log('Healing cancelled')
              process.exit(0)
            }
          }
          
          process.stdin.setRawMode(false)
          process.stdin.pause()
        } else {
          console.log('No suitable healing action found')
          process.exit(1)
        }
      }

      // Execute healing
      const result = await doctor.healFailure(failure, analysis)
      
      logger.info('Healing completed', {
        action: result.action.type,
        outcome: result.outcome,
        humanIntervention: result.metadata.humanIntervention
      })

      console.log('\n=== Healing Results ===')
      console.log(`Action: ${result.action.description}`)
      console.log(`Outcome: ${result.outcome}`)
      console.log(`Details: ${result.details}`)
      console.log(`Healing Time: ${result.metadata.healingTime}ms`)
      console.log(`Cost: $${result.metadata.cost.toFixed(4)}`)
      console.log(`Human Intervention: ${result.metadata.humanIntervention}`)

      if (result.artifacts && result.artifacts.length > 0) {
        console.log(`Artifacts: ${result.artifacts.join(', ')}`)
      }

    } catch (error) {
      logger.error('Failed to heal failure', { error })
      process.exit(1)
    }
  })

// Monitor Command
program
  .command('monitor')
  .description('Monitor active healings')
  .option('--status <status>', 'Filter by status (success/failed/partial)')
  .action(async (options) => {
    try {
      // This would integrate with a monitoring system
      // For now, show a mock status
      console.log('=== Active Healings Monitor ===')
      console.log('No active healings found')
      
      // In production, this would:
      // 1. Connect to the healing database/storage
      // 2. Query active healings
      // 3. Filter by status if provided
      // 4. Display results in a formatted table

    } catch (error) {
      logger.error('Failed to monitor healings', { error })
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()
