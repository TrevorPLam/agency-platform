#!/usr/bin/env tsx

/**
 * DORA Metrics Collection Script
 * 
 * This script manually collects DORA metrics from GitHub and stores them in the database.
 * It can be run locally for testing or triggered by automation.
 * 
 * Usage:
 *   pnpm tsx scripts/metrics/dora-collector.ts [options]
 * 
 * Options:
 *   --time-window-days <number>  Time window for metrics calculation (default: 30)
 *   --environment <name>          Environment to analyze (default: production)
 *   --dry-run                     Show what would be collected without storing
 *   --output <format>             Output format: json | table (default: json)
 */

import { program } from 'commander'
import { execSync } from 'child_process'
import { createClient } from '@agency/database/admin'
import { DORAMetricsCollector } from '@agency/metrics'

interface CollectionOptions {
  timeWindowDays: number
  environment: string
  dryRun: boolean
  output: 'json' | 'table'
}

async function collectGitHubData(options: CollectionOptions) {
  console.log(`🔍 Collecting GitHub data for the last ${options.timeWindowDays} days...`)
  
  const sinceDate = new Date(Date.now() - (options.timeWindowDays * 24 * 60 * 60 * 1000)).toISOString()
  console.log(`📅 Collection period: ${sinceDate} to ${new Date().toISOString()}`)
  
  try {
    // Get merged PRs to main branch (deployments)
    console.log('📥 Collecting deployment events...')
    const prs = JSON.parse(execSync(
      `gh pr list --repo $GITHUB_REPOSITORY --base main --state merged --json number,mergedAt,headRefName,title --limit 100`,
      { encoding: 'utf-8' }
    ))
    
    const deployments = []
    for (const pr of prs) {
      if (new Date(pr.mergedAt) >= new Date(sinceDate)) {
        const commits = JSON.parse(execSync(
          `gh pr view ${pr.number} --repo $GITHUB_REPOSITORY --json commits --jq '.commits[-1].oid'`,
          { encoding: 'utf-8' }
        ))
        
        deployments.push({
          id: `deploy-${pr.number}`,
          timestamp: pr.mergedAt,
          commit_sha: commits,
          environment: options.environment,
          service: 'agency-platform',
          status: 'success',
          metadata: {
            pr_number: pr.number,
            pr_title: pr.title,
            branch: pr.headRefName
          }
        })
      }
    }
    
    // Get PRs created in time window (for lead time calculation)
    console.log('📥 Collecting pull request events...')
    const allPrs = JSON.parse(execSync(
      `gh pr list --repo $GITHUB_REPOSITORY --state all --json number,createdAt,mergedAt,baseRefName,headRefName,title --limit 200`,
      { encoding: 'utf-8' }
    ))
    
    const pullRequests = []
    for (const pr of allPrs) {
      if (new Date(pr.createdAt) >= new Date(sinceDate)) {
        try {
          const commits = JSON.parse(execSync(
            `gh pr view ${pr.number} --repo $GITHUB_REPOSITORY --json commits --jq '.commits | .[-1] | {oid: .oid, date: .committedDate}'`,
            { encoding: 'utf-8' }
          ))
          
          pullRequests.push({
            id: `pr-${pr.number}`,
            number: pr.number,
            first_commit_at: commits.date,
            created_at: pr.createdAt,
            merged_at: pr.mergedAt || null,
            base_branch: pr.baseRefName,
            head_branch: pr.headRefName,
            metadata: {
              pr_title: pr.title,
              commit_sha: commits.oid
            }
          })
        } catch (error) {
          console.warn(`⚠️  Skipping PR ${pr.number} due to error: ${(error as Error).message}`)
        }
      }
    }
    
    console.log(`✅ Found ${deployments.length} deployments and ${pullRequests.length} pull requests`)
    
    return { deployments, pullRequests }
  } catch (error) {
    console.error('❌ Error collecting GitHub data:', error)
    throw error
  }
}

async function storeMetricsData(
  deployments: any[],
  pullRequests: any[],
  options: CollectionOptions
) {
  if (options.dryRun) {
    console.log('🔍 DRY RUN - Would store the following data:')
    console.log(`   Deployments: ${deployments.length}`)
    console.log(`   Pull Requests: ${pullRequests.length}`)
    return
  }
  
  console.log('💾 Storing metrics data in database...')
  
  const supabase = createClient()
  
  try {
    // Store deployments
    for (const deployment of deployments) {
      console.log(`   Storing deployment: ${deployment.id}`)
      const { error } = await supabase.from('deployments').upsert({
        id: deployment.id,
        timestamp: deployment.timestamp,
        commit_sha: deployment.commit_sha,
        environment: deployment.environment,
        service: deployment.service,
        status: deployment.status,
        metadata: deployment.metadata
      })
      
      if (error) {
        console.warn(`⚠️  Error storing deployment ${deployment.id}:`, error.message)
      }
    }
    
    // Store pull requests
    for (const pr of pullRequests) {
      console.log(`   Storing PR: ${pr.id}`)
      const { error } = await supabase.from('pull_requests').upsert({
        id: pr.id,
        number: pr.number,
        first_commit_at: pr.first_commit_at,
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        base_branch: pr.base_branch,
        head_branch: pr.head_branch,
        metadata: pr.metadata
      })
      
      if (error) {
        console.warn(`⚠️  Error storing PR ${pr.id}:`, error.message)
      }
    }
    
    console.log('✅ Metrics data stored successfully')
  } catch (error) {
    console.error('❌ Error storing metrics data:', error)
    throw error
  }
}

async function calculateAndStoreMetrics(options: CollectionOptions) {
  if (options.dryRun) {
    console.log('🔍 DRY RUN - Would calculate DORA metrics with the collected data')
    return
  }
  
  console.log('📊 Calculating DORA metrics...')
  
  const collector = new DORAMetricsCollector({
    timeWindowDays: options.timeWindowDays,
    environments: [options.environment],
    services: [], // All services
    alertThresholds: {
      deploymentFrequency: 7,
      leadTimeForChanges: 24,
      changeFailureRate: 15,
      meanTimeToRecovery: 1
    }
  })
  
  try {
    const result = await collector.calculateMetrics()
    
    console.log('📈 DORA Metrics Results:')
    console.log('=====================================')
    console.log(`Deployment Frequency: ${result.metrics.deploymentFrequency} deployments/week`)
    console.log(`Lead Time for Changes: ${result.metrics.leadTimeForChanges} hours`)
    console.log(`Change Failure Rate: ${result.metrics.changeFailureRate}%`)
    console.log(`Mean Time to Recovery: ${result.metrics.meanTimeToRecovery} hours`)
    console.log('=====================================')
    
    // Store metrics results
    const supabase = createClient()
    const { error } = await supabase.from('dora_metrics_results').insert({
      calculated_at: new Date().toISOString(),
      period_start: result.period.start,
      period_end: result.period.end,
      deployment_frequency: result.metrics.deploymentFrequency,
      lead_time_for_changes: result.metrics.leadTimeForChanges,
      change_failure_rate: result.metrics.changeFailureRate,
      mean_time_to_recovery: result.metrics.meanTimeToRecovery,
      deployment_performance_level: result.performanceLevels['deployment-frequency'].level,
      lead_time_performance_level: result.performanceLevels['lead-time-for-changes'].level,
      failure_rate_performance_level: result.performanceLevels['change-failure-rate'].level,
      mttr_performance_level: result.performanceLevels['mean-time-to-recovery'].level,
      data_points_deployments: result.dataPoints.deployments,
      data_points_incidents: result.dataPoints.incidents,
      data_points_pull_requests: result.dataPoints.pullRequests
    })
    
    if (error) {
      console.warn('⚠️  Error storing metrics results:', error.message)
    } else {
      console.log('✅ DORA metrics calculated and stored successfully')
    }
    
    // Output results in requested format
    if (options.output === 'json') {
      console.log('\n📄 JSON Output:')
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('\n📊 Summary Table:')
      console.log('| Metric | Value | Performance Level |')
      console.log('|--------|-------|-------------------|')
      console.log(`| Deployment Frequency | ${result.metrics.deploymentFrequency} deployments/week | ${result.performanceLevels['deployment-frequency'].level} |`)
      console.log(`| Lead Time for Changes | ${result.metrics.leadTimeForChanges} hours | ${result.performanceLevels['lead-time-for-changes'].level} |`)
      console.log(`| Change Failure Rate | ${result.metrics.changeFailureRate}% | ${result.performanceLevels['change-failure-rate'].level} |`)
      console.log(`| Mean Time to Recovery | ${result.metrics.meanTimeToRecovery} hours | ${result.performanceLevels['mean-time-to-recovery'].level} |`)
    }
    
  } catch (error) {
    console.error('❌ Error calculating DORA metrics:', error)
    throw error
  }
}

async function main() {
  program
    .name('dora-collector')
    .description('Manual DORA metrics collection script')
    .option('--time-window-days <number>', 'Time window for metrics calculation', '30')
    .option('--environment <name>', 'Environment to analyze', 'production')
    .option('--dry-run', 'Show what would be collected without storing', false)
    .option('--output <format>', 'Output format: json | table', 'json')
    .parse()
  
  const options = program.opts() as CollectionOptions
  
  // Validate options
  if (options.timeWindowDays < 1 || options.timeWindowDays > 365) {
    console.error('❌ timeWindowDays must be between 1 and 365')
    process.exit(1)
  }
  
  if (!['json', 'table'].includes(options.output)) {
    console.error('❌ output format must be "json" or "table"')
    process.exit(1)
  }
  
  // Check for GitHub CLI
  try {
    execSync('gh --version', { stdio: 'ignore' })
  } catch {
    console.error('❌ GitHub CLI (gh) is required. Please install it first.')
    process.exit(1)
  }
  
  // Check for GITHUB_REPOSITORY environment variable
  if (!process.env.GITHUB_REPOSITORY) {
    console.error('❌ GITHUB_REPOSITORY environment variable is required')
    process.exit(1)
  }
  
  try {
    console.log('🚀 Starting DORA metrics collection...')
    console.log(`📋 Configuration:`)
    console.log(`   Time Window: ${options.timeWindowDays} days`)
    console.log(`   Environment: ${options.environment}`)
    console.log(`   Dry Run: ${options.dryRun}`)
    console.log(`   Output Format: ${options.output}`)
    console.log(`   Repository: ${process.env.GITHUB_REPOSITORY}`)
    console.log('')
    
    // Collect data from GitHub
    const { deployments, pullRequests } = await collectGitHubData(options)
    
    // Store data in database
    await storeMetricsData(deployments, pullRequests, options)
    
    // Calculate and store metrics
    await calculateAndStoreMetrics(options)
    
    console.log('\n🎉 DORA metrics collection completed successfully!')
    
  } catch (error) {
    console.error('\n💥 DORA metrics collection failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { main, collectGitHubData, storeMetricsData, calculateAndStoreMetrics }
