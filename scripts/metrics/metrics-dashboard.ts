#!/usr/bin/env tsx

/**
 * DORA Metrics Dashboard Script
 * 
 * This script generates a comprehensive DORA metrics dashboard report
 * from the collected data in the database.
 * 
 * Usage:
 *   pnpm tsx scripts/metrics/metrics-dashboard.ts [options]
 * 
 * Options:
 *   --time-window-days <number>  Time window for metrics (default: 30)
 *   --format <format>             Output format: cli | html | json (default: cli)
 *   --output <file>               Output file (optional, defaults to stdout)
 */

import { program } from 'commander'
import { createClient } from '@agency/database/admin'
import { DORAMetricsCollector } from '@agency/metrics'

interface DashboardOptions {
  timeWindowDays: number
  format: 'cli' | 'html' | 'json'
  output?: string
}

interface DashboardData {
  metrics: any
  performanceLevels: any
  period: any
  dataPoints: any
  calculatedAt: string
  historicalData?: any[]
}

async function fetchMetricsData(options: DashboardOptions): Promise<DashboardData> {
  console.log('📊 Fetching DORA metrics data...')
  
  const collector = new DORAMetricsCollector({
    timeWindowDays: options.timeWindowDays,
    environments: ['production'],
    services: [],
    alertThresholds: {
      deploymentFrequency: 7,
      leadTimeForChanges: 24,
      changeFailureRate: 15,
      meanTimeToRecovery: 1
    }
  })
  
  try {
    const result = await collector.calculateMetrics()
    
    // Fetch historical data for trends
    const supabase = createClient()
    const { data: historicalData, error } = await supabase
      .from('dora_metrics_results')
      .select('*')
      .gte('calculated_at', new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)).toISOString())
      .order('calculated_at', { ascending: true })
    
    if (error) {
      console.warn('⚠️  Error fetching historical data:', error.message)
    }
    
    return {
      metrics: result.metrics,
      performanceLevels: result.performanceLevels,
      period: result.period,
      dataPoints: result.dataPoints,
      calculatedAt: result.calculatedAt,
      historicalData: historicalData || []
    }
  } catch (error) {
    console.error('❌ Error fetching metrics data:', error)
    throw error
  }
}

function generateCLIReport(data: DashboardData): string {
  const { metrics, performanceLevels, period, dataPoints, calculatedAt, historicalData } = data
  
  let report = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                              DORA METRICS DASHBOARD                               ║
╚════════════════════════════════════════════════════════════════════════════════╝

📅 Analysis Period: ${new Date(period.start).toLocaleDateString()} - ${new Date(period.end).toLocaleDateString()}
🕐 Calculated: ${new Date(calculatedAt).toLocaleString()}
📊 Data Points: ${dataPoints.deployments} deployments, ${dataPoints.incidents} incidents, ${dataPoints.pullRequests} PRs

┌─────────────────────────────────┬──────────────┬──────────────────┬─────────────────────────────────────┐
│           METRIC                │    VALUE     │ PERFORMANCE      │              DESCRIPTION               │
├─────────────────────────────────┼──────────────┼──────────────────┼─────────────────────────────────────┤
│ Deployment Frequency           │ ${String(metrics.deploymentFrequency).padStart(8)} deployments/week │ ${String(performanceLevels['deployment-frequency'].level).padStart(16)} │ ${performanceLevels['deployment-frequency'].description.padEnd(35)} │
│ Lead Time for Changes           │ ${String(metrics.leadTimeForChanges).padStart(8)} hours          │ ${String(performanceLevels['lead-time-for-changes'].level).padStart(16)} │ ${performanceLevels['lead-time-for-changes'].description.padEnd(35)} │
│ Change Failure Rate             │ ${String(metrics.changeFailureRate).padStart(8)}%                │ ${String(performanceLevels['change-failure-rate'].level).padStart(16)} │ ${performanceLevels['change-failure-rate'].description.padEnd(35)} │
│ Mean Time to Recovery           │ ${String(metrics.meanTimeToRecovery).padStart(8)} hours          │ ${String(performanceLevels['mean-time-to-recovery'].level).padStart(16)} │ ${performanceLevels['mean-time-to-recovery'].description.padEnd(35)} │
└─────────────────────────────────┴──────────────┴──────────────────┴─────────────────────────────────────┘

🎯 PERFORMANCE LEVELS:
`

  // Add performance level explanations
  const levelColors = {
    Elite: '🟢',
    High: '🟡', 
    Medium: '🟠',
    Low: '🔴'
  }
  
  Object.entries(performanceLevels).forEach(([metric, level]: [string, any]) => {
    const color = levelColors[level.level as keyof typeof levelColors]
    const metricName = metric.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    report += `\n   ${color} ${metricName.padEnd(25)}: ${level.level.padEnd(6)} (${level.description})`
  })
  
  // Add historical trends if available
  if (historicalData && historicalData.length > 0) {
    report += `

📈 HISTORICAL TRENDS (Last ${historicalData.length} calculations):
`
    
    historicalData.slice(-5).forEach((record: any) => {
      const date = new Date(record.calculated_at).toLocaleDateString()
      const df = record.deployment_frequency?.toFixed(1) || 'N/A'
      const lt = record.lead_time_for_changes?.toFixed(1) || 'N/A'
      const cfr = record.change_failure_rate?.toFixed(1) || 'N/A'
      const mttr = record.mean_time_to_recovery?.toFixed(1) || 'N/A'
      
      report += `\n   ${date.padEnd(12)} │ DF: ${df.padStart(5)} │ LT: ${lt.padStart(5)}h │ CFR: ${cfr.padStart(5)}% │ MTTR: ${mttr.padStart(5)}h`
    })
  }
  
  // Add recommendations
  report += `

💡 RECOMMENDATIONS:
`
  
  const recommendations = []
  
  if (performanceLevels['deployment-frequency'].level === 'Low') {
    recommendations.push('• Consider implementing CI/CD automation to increase deployment frequency')
  }
  
  if (performanceLevels['lead-time-for-changes'].level === 'Low') {
    recommendations.push('• Review and optimize your development and deployment pipeline')
  }
  
  if (performanceLevels['change-failure-rate'].level === 'Low') {
    recommendations.push('• Invest in automated testing and code review processes')
  }
  
  if (performanceLevels['mean-time-to-recovery'].level === 'Low') {
    recommendations.push('• Improve incident response procedures and monitoring')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• Great job! Your metrics are performing well. Continue current practices.')
  }
  
  report += recommendations.join('\n')
  
  report += `

🔗 NEXT STEPS:
   • Run 'pnpm tsx scripts/metrics/dora-collector.ts' to collect fresh data
   • Check the agency admin dashboard for interactive visualization
   • Set up alerting for metric regressions
   • Review trends monthly and adjust processes accordingly

Generated by DORA Metrics Dashboard Script
`
  
  return report
}

function generateJSONReport(data: DashboardData): string {
  return JSON.stringify(data, null, 2)
}

function generateHTMLReport(data: DashboardData): string {
  const { metrics, performanceLevels, period, dataPoints, calculatedAt, historicalData } = data
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DORA Metrics Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        .header-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .metric-label { font-size: 0.9em; color: #666; margin: 5px 0; }
        .performance-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .elite { background: #28a745; color: white; }
        .high { background: #ffc107; color: black; }
        .medium { background: #fd7e14; color: white; }
        .low { background: #dc3545; color: white; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 5px; border-left: 4px solid #007acc; }
        .recommendations h3 { margin-top: 0; color: #007acc; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e4e8; }
        th { background: #f6f8fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DORA Metrics Dashboard</h1>
        
        <div class="header-info">
            <strong>Analysis Period:</strong> ${new Date(period.start).toLocaleDateString()} - ${new Date(period.end).toLocaleDateString()}<br>
            <strong>Calculated:</strong> ${new Date(calculatedAt).toLocaleString()}<br>
            <strong>Data Points:</strong> ${dataPoints.deployments} deployments, ${dataPoints.incidents} incidents, ${dataPoints.pullRequests} PRs
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${metrics.deploymentFrequency}</div>
                <div class="metric-label">Deployments per Week</div>
                <span class="performance-badge ${performanceLevels['deployment-frequency'].level.toLowerCase()}">${performanceLevels['deployment-frequency'].level}</span>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.leadTimeForChanges}h</div>
                <div class="metric-label">Lead Time for Changes</div>
                <span class="performance-badge ${performanceLevels['lead-time-for-changes'].level.toLowerCase()}">${performanceLevels['lead-time-for-changes'].level}</span>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.changeFailureRate}%</div>
                <div class="metric-label">Change Failure Rate</div>
                <span class="performance-badge ${performanceLevels['change-failure-rate'].level.toLowerCase()}">${performanceLevels['change-failure-rate'].level}</span>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.meanTimeToRecovery}h</div>
                <div class="metric-label">Mean Time to Recovery</div>
                <span class="performance-badge ${performanceLevels['mean-time-to-recovery'].level.toLowerCase()}">${performanceLevels['mean-time-to-recovery'].level}</span>
            </div>
        </div>
        
        <h2>Performance Details</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Performance Level</th>
                <th>Description</th>
            </tr>
            <tr>
                <td>Deployment Frequency</td>
                <td>${metrics.deploymentFrequency} deployments/week</td>
                <td><span class="performance-badge ${performanceLevels['deployment-frequency'].level.toLowerCase()}">${performanceLevels['deployment-frequency'].level}</span></td>
                <td>${performanceLevels['deployment-frequency'].description}</td>
            </tr>
            <tr>
                <td>Lead Time for Changes</td>
                <td>${metrics.leadTimeForChanges} hours</td>
                <td><span class="performance-badge ${performanceLevels['lead-time-for-changes'].level.toLowerCase()}">${performanceLevels['lead-time-for-changes'].level}</span></td>
                <td>${performanceLevels['lead-time-for-changes'].description}</td>
            </tr>
            <tr>
                <td>Change Failure Rate</td>
                <td>${metrics.changeFailureRate}%</td>
                <td><span class="performance-badge ${performanceLevels['change-failure-rate'].level.toLowerCase()}">${performanceLevels['change-failure-rate'].level}</span></td>
                <td>${performanceLevels['change-failure-rate'].description}</td>
            </tr>
            <tr>
                <td>Mean Time to Recovery</td>
                <td>${metrics.meanTimeToRecovery} hours</td>
                <td><span class="performance-badge ${performanceLevels['mean-time-to-recovery'].level.toLowerCase()}">${performanceLevels['mean-time-to-recovery'].level}</span></td>
                <td>${performanceLevels['mean-time-to-recovery'].description}</td>
            </tr>
        </table>
        
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${getRecommendationsHTML(performanceLevels)}
            </ul>
        </div>
        
        ${historicalData && historicalData.length > 0 ? `
        <h2>📈 Historical Trends</h2>
        <table>
            <tr>
                <th>Date</th>
                <th>Deployment Frequency</th>
                <th>Lead Time</th>
                <th>Failure Rate</th>
                <th>MTTR</th>
            </tr>
            ${historicalData.slice(-10).map((record: any) => `
            <tr>
                <td>${new Date(record.calculated_at).toLocaleDateString()}</td>
                <td>${record.deployment_frequency?.toFixed(1) || 'N/A'}</td>
                <td>${record.lead_time_for_changes?.toFixed(1) || 'N/A'}h</td>
                <td>${record.change_failure_rate?.toFixed(1) || 'N/A'}%</td>
                <td>${record.mean_time_to_recovery?.toFixed(1) || 'N/A'}h</td>
            </tr>
            `).join('')}
        </table>
        ` : ''}
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #666; font-size: 0.9em;">
            Generated by DORA Metrics Dashboard Script | ${new Date().toLocaleString()}
        </footer>
    </div>
</body>
</html>
`
}

function getRecommendationsHTML(performanceLevels: any): string {
  const recommendations = []
  
  if (performanceLevels['deployment-frequency'].level === 'Low') {
    recommendations.push('<li>Consider implementing CI/CD automation to increase deployment frequency</li>')
  }
  
  if (performanceLevels['lead-time-for-changes'].level === 'Low') {
    recommendations.push('<li>Review and optimize your development and deployment pipeline</li>')
  }
  
  if (performanceLevels['change-failure-rate'].level === 'Low') {
    recommendations.push('<li>Invest in automated testing and code review processes</li>')
  }
  
  if (performanceLevels['mean-time-to-recovery'].level === 'Low') {
    recommendations.push('<li>Improve incident response procedures and monitoring</li>')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('<li>Great job! Your metrics are performing well. Continue current practices.</li>')
  }
  
  return recommendations.join('')
}

async function main() {
  program
    .name('metrics-dashboard')
    .description('Generate DORA metrics dashboard report')
    .option('--time-window-days <number>', 'Time window for metrics', '30')
    .option('--format <format>', 'Output format: cli | html | json', 'cli')
    .option('--output <file>', 'Output file (optional)')
    .parse()
  
  const options = program.opts() as DashboardOptions
  
  // Validate options
  if (options.timeWindowDays < 1 || options.timeWindowDays > 365) {
    console.error('❌ timeWindowDays must be between 1 and 365')
    process.exit(1)
  }
  
  if (!['cli', 'html', 'json'].includes(options.format)) {
    console.error('❌ format must be "cli", "html", or "json"')
    process.exit(1)
  }
  
  try {
    console.log('📊 Generating DORA metrics dashboard...')
    console.log(`📋 Configuration:`)
    console.log(`   Time Window: ${options.timeWindowDays} days`)
    console.log(`   Format: ${options.format}`)
    if (options.output) console.log(`   Output File: ${options.output}`)
    console.log('')
    
    // Fetch metrics data
    const data = await fetchMetricsData(options)
    
    // Generate report
    let report: string
    switch (options.format) {
      case 'json':
        report = generateJSONReport(data)
        break
      case 'html':
        report = generateHTMLReport(data)
        break
      case 'cli':
      default:
        report = generateCLIReport(data)
        break
    }
    
    // Output report
    if (options.output) {
      require('fs').writeFileSync(options.output, report)
      console.log(`✅ Dashboard report saved to ${options.output}`)
    } else {
      console.log(report)
    }
    
  } catch (error) {
    console.error('❌ Error generating dashboard:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { main, fetchMetricsData, generateCLIReport, generateHTMLReport, generateJSONReport }
