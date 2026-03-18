#!/usr/bin/env tsx

/**
 * DORA Metrics Alerting System
 * 
 * This script monitors DORA metrics and sends alerts for regressions or improvements.
 * It can be run as part of the metrics collection workflow or as a standalone check.
 * 
 * Usage:
 *   pnpm tsx scripts/metrics/dora-alerting.ts [options]
 * 
 * Options:
 *   --time-window-days <number>  Time window for comparison (default: 30)
 *   --comparison-period <number>  Period to compare against in days (default: 60)
 *   --webhook <url>              Webhook URL for notifications (optional)
 *   --slack-channel <name>       Slack channel for notifications (optional)
 *   --dry-run                    Show alerts without sending
 */

import { program } from 'commander'
import { createClient } from '@agency/database/admin'
import { DORAMetricsCollector } from '@agency/metrics'

interface AlertOptions {
  timeWindowDays: number
  comparisonPeriod: number
  webhook?: string
  slackChannel?: string
  dryRun: boolean
}

interface MetricAlert {
  type: 'regression' | 'improvement'
  metric: string
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AlertReport {
  alerts: MetricAlert[]
  summary: {
    total: number
    regressions: number
    improvements: number
    bySeverity: Record<string, number>
  }
  period: {
    current: { start: string; end: string }
    previous: { start: string; end: string }
  }
}

interface PerformanceThresholds {
  deploymentFrequency: { elite: 7; high: 1; medium: 0.25 }
  leadTimeForChanges: { elite: 24; high: 168; medium: 720 }
  changeFailureRate: { elite: 15; high: 30; medium: 46 }
  meanTimeToRecovery: { elite: 1; high: 24; medium: 168 }
}

const thresholds: PerformanceThresholds = {
  deploymentFrequency: { elite: 7, high: 1, medium: 0.25 },
  leadTimeForChanges: { elite: 24, high: 168, medium: 720 },
  changeFailureRate: { elite: 15, high: 30, medium: 46 },
  meanTimeToRecovery: { elite: 1, high: 24, medium: 168 }
}

function getPerformanceLevel(metric: string, value: number): string {
  const metricThresholds = thresholds[metric as keyof PerformanceThresholds]
  
  if (metric === 'deploymentFrequency') {
    if (value >= metricThresholds.elite) return 'elite'
    if (value >= metricThresholds.high) return 'high'
    if (value >= metricThresholds.medium) return 'medium'
    return 'low'
  } else {
    // For metrics where lower is better (lead time, failure rate, MTTR)
    if (value <= metricThresholds.elite) return 'elite'
    if (value <= metricThresholds.high) return 'high'
    if (value <= metricThresholds.medium) return 'medium'
    return 'low'
  }
}

function calculateSeverity(
  metric: string,
  currentValue: number,
  previousValue: number,
  changePercent: number
): 'low' | 'medium' | 'high' | 'critical' {
  const currentLevel = getPerformanceLevel(metric, currentValue)
  const previousLevel = getPerformanceLevel(metric, previousValue)
  
  // Critical: dropped from elite/medium to low
  if ((['elite', 'high', 'medium'].includes(previousLevel)) && currentLevel === 'low') {
    return 'critical'
  }
  
  // High: dropped more than 50% or crossed performance level boundary
  if (changePercent > 50 || currentLevel !== previousLevel) {
    return 'high'
  }
  
  // Medium: dropped more than 20%
  if (changePercent > 20) {
    return 'medium'
  }
  
  // Low: minor regression (< 20%)
  if (changePercent > 5) {
    return 'low'
  }
  
  return 'low'
}

async function fetchMetricsForPeriod(
  timeWindowDays: number,
  periodOffset: number = 0
): Promise<any> {
  const collector = new DORAMetricsCollector({
    timeWindowDays,
    environments: ['production'],
    services: [],
    alertThresholds: {
      deploymentFrequency: 7,
      leadTimeForChanges: 24,
      changeFailureRate: 15,
      meanTimeToRecovery: 1
    }
  })
  
  // Calculate the date range for this period
  const endDate = new Date(Date.now() - (periodOffset * 24 * 60 * 60 * 1000))
  const startDate = new Date(endDate.getTime() - (timeWindowDays * 24 * 60 * 60 * 1000))
  
  try {
    const result = await collector.calculateMetrics()
    
    // For now, we'll simulate fetching historical data
    // In a real implementation, this would query the database for the specific period
    return {
      metrics: result.metrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching metrics for period:', error)
    throw error
  }
}

function detectAlerts(
  currentMetrics: any,
  previousMetrics: any
): MetricAlert[] {
  const alerts: MetricAlert[] = []
  
  const metricConfigs = [
    { key: 'deploymentFrequency', name: 'Deployment Frequency', unit: 'deployments/week', inverse: false },
    { key: 'leadTimeForChanges', name: 'Lead Time for Changes', unit: 'hours', inverse: true },
    { key: 'changeFailureRate', name: 'Change Failure Rate', unit: '%', inverse: true },
    { key: 'meanTimeToRecovery', name: 'Mean Time to Recovery', unit: 'hours', inverse: true }
  ]
  
  for (const config of metricConfigs) {
    const currentValue = currentMetrics[config.key]
    const previousValue = previousMetrics[config.key]
    
    if (currentValue === null || previousValue === null) {
      continue // Skip if we don't have data for either period
    }
    
    // Calculate change
    let change: number
    let changePercent: number
    
    if (config.inverse) {
      // For metrics where lower is better
      change = currentValue - previousValue
      changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0
    } else {
      // For metrics where higher is better
      change = currentValue - previousValue
      changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0
    }
    
    // Determine if this is an alert (significant change)
    const isRegression = config.inverse ? change > 0.05 : change < -0.05
    const isImprovement = config.inverse ? change < -0.05 : change > 0.05
    const isSignificant = Math.abs(changePercent) > 5 // 5% change threshold
    
    if (isSignificant && (isRegression || isImprovement)) {
      const alertType = isRegression ? 'regression' : 'improvement'
      const severity = calculateSeverity(config.key, currentValue, previousValue, Math.abs(changePercent))
      
      const message = isRegression
        ? `${config.name} regressed from ${previousValue.toFixed(2)} to ${currentValue.toFixed(2)} ${config.unit} (${changePercent.toFixed(1)}% worse)`
        : `${config.name} improved from ${previousValue.toFixed(2)} to ${currentValue.toFixed(2)} ${config.unit} (${Math.abs(changePercent).toFixed(1)}% better)`
      
      alerts.push({
        type: alertType,
        metric: config.name,
        currentValue,
        previousValue,
        change,
        changePercent,
        message,
        severity
      })
    }
  }
  
  return alerts
}

function generateAlertReport(alerts: MetricAlert[], currentPeriod: any, previousPeriod: any): AlertReport {
  const summary = {
    total: alerts.length,
    regressions: alerts.filter(a => a.type === 'regression').length,
    improvements: alerts.filter(a => a.type === 'improvement').length,
    bySeverity: alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  return {
    alerts,
    summary,
    period: {
      current: currentPeriod.period,
      previous: previousPeriod.period
    }
  }
}

function formatAlertReport(report: AlertReport): string {
  let output = `
🚨 DORA METRICS ALERT REPORT
================================

📅 Analysis Periods:
   Current: ${new Date(report.period.current.start).toLocaleDateString()} - ${new Date(report.period.current.end).toLocaleDateString()}
   Previous: ${new Date(report.period.previous.start).toLocaleDateString()} - ${new Date(report.period.previous.end).toLocaleDateString()}

📊 Summary:
   Total Alerts: ${report.summary.total}
   Regressions: ${report.summary.regressions}
   Improvements: ${report.summary.improvements}
   By Severity: ${Object.entries(report.summary.bySeverity).map(([severity, count]) => `${severity} (${count})`).join(', ')}

`

  if (report.alerts.length === 0) {
    output += `✅ No significant metric changes detected. All metrics are stable.\n`
  } else {
    output += `🔍 Detailed Alerts:\n`
    
    // Group alerts by severity
    const groupedAlerts = report.alerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) acc[alert.severity] = []
      acc[alert.severity].push(alert)
      return acc
    }, {} as Record<string, MetricAlert[]>)
    
    const severityOrder = ['critical', 'high', 'medium', 'low']
    const severityIcons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    }
    
    for (const severity of severityOrder) {
      const alerts = groupedAlerts[severity]
      if (alerts && alerts.length > 0) {
        output += `\n${severityIcons[severity]} ${severity.toUpperCase()} (${alerts.length}):\n`
        for (const alert of alerts) {
          const icon = alert.type === 'regression' ? '📉' : '📈'
          output += `   ${icon} ${alert.message}\n`
        }
      }
    }
  }
  
  output += `
💡 Recommendations:
`
  
  const criticalAlerts = report.alerts.filter(a => a.severity === 'critical')
  const highAlerts = report.alerts.filter(a => a.severity === 'high')
  
  if (criticalAlerts.length > 0) {
    output += `   🚨 CRITICAL: ${criticalAlerts.length} critical regressions detected. Immediate action required.\n`
  }
  
  if (highAlerts.length > 0) {
    output += `   ⚠️  HIGH: ${highAlerts.length} significant regressions need attention.\n`
  }
  
  if (report.summary.regressions > 0) {
    output += `   📊 Review recent changes that may have impacted the regressed metrics.\n`
    output += `   🧪 Consider running additional tests to identify root causes.\n`
  }
  
  if (report.summary.improvements > 0) {
    output += `   🎉 ${report.summary.improvements} improvements detected! Analyze what worked well.\n`
  }
  
  if (report.alerts.length === 0) {
    output += `   ✅ Continue current practices. All metrics are performing well.\n`
  }
  
  return output
}

async function sendWebhookNotification(report: AlertReport, webhookUrl: string): Promise<void> {
  const payload = {
    text: `🚨 DORA Metrics Alert Report`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 DORA Metrics Alert Report'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Alerts:* ${report.summary.total}`
          },
          {
            type: 'mrkdwn',
            text: `*Regressions:* ${report.summary.regressions}`
          },
          {
            type: 'mrkdwn',
            text: `*Improvements:* ${report.summary.improvements}`
          },
          {
            type: 'mrkdwn',
            text: `*Period:* ${new Date(report.period.current.start).toLocaleDateString()} - ${new Date(report.period.current.end).toLocaleDateString()}`
          }
        ]
      }
    ]
  }
  
  // Add critical and high alerts to the notification
  const importantAlerts = report.alerts.filter(a => ['critical', 'high'].includes(a.severity))
  
  if (importantAlerts.length > 0) {
    payload.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🚨 Important Alerts:*\n${importantAlerts.map(a => `• ${a.message}`).join('\n')}`
      }
    })
  }
  
  if (!report.alerts.some(a => ['critical', 'high'].includes(a.severity))) {
    payload.blocks.push({
      type: 'section',
      text: {
        type: 'plain_text',
        text: '✅ No critical or high alerts. All metrics are stable.'
      }
    })
  }
  
  // In a real implementation, this would send the webhook
  console.log(`📡 Would send webhook notification to: ${webhookUrl}`)
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2))
}

async function main() {
  program
    .name('dora-alerting')
    .description('DORA metrics alerting system')
    .option('--time-window-days <number>', 'Time window for current period', '30')
    .option('--comparison-period <number>', 'Days to go back for comparison', '60')
    .option('--webhook <url>', 'Webhook URL for notifications')
    .option('--slack-channel <name>', 'Slack channel for notifications')
    .option('--dry-run', 'Show alerts without sending', false)
    .parse()
  
  const options = program.opts() as AlertOptions
  
  // Validate options
  if (options.timeWindowDays < 1 || options.timeWindowDays > 365) {
    console.error('❌ timeWindowDays must be between 1 and 365')
    process.exit(1)
  }
  
  if (options.comparisonPeriod < options.timeWindowDays) {
    console.error('❌ comparison-period must be larger than time-window-days')
    process.exit(1)
  }
  
  try {
    console.log('🚨 Starting DORA metrics alerting...')
    console.log(`📋 Configuration:`)
    console.log(`   Current Period: ${options.timeWindowDays} days`)
    console.log(`   Comparison Period: ${options.comparisonPeriod} days ago`)
    console.log(`   Dry Run: ${options.dryRun}`)
    if (options.webhook) console.log(`   Webhook: ${options.webhook}`)
    if (options.slackChannel) console.log(`   Slack Channel: ${options.slackChannel}`)
    console.log('')
    
    // Fetch metrics for current period
    console.log('📊 Fetching current metrics...')
    const currentMetrics = await fetchMetricsForPeriod(options.timeWindowDays, 0)
    
    // Fetch metrics for previous period
    console.log('📈 Fetching previous metrics for comparison...')
    const previousMetrics = await fetchMetricsForPeriod(options.timeWindowDays, options.comparisonPeriod - options.timeWindowDays)
    
    // Detect alerts
    console.log('🔍 Analyzing metric changes...')
    const alerts = detectAlerts(currentMetrics.metrics, previousMetrics.metrics)
    
    // Generate report
    const report = generateAlertReport(alerts, currentMetrics, previousMetrics)
    
    // Format and display report
    const formattedReport = formatAlertReport(report)
    console.log(formattedReport)
    
    // Send notifications if there are alerts and not in dry-run mode
    if (!options.dryRun && report.alerts.length > 0) {
      if (options.webhook) {
        await sendWebhookNotification(report, options.webhook)
      }
      
      if (options.slackChannel) {
        console.log(`💬 Would send Slack notification to #${options.slackChannel}`)
      }
    } else if (options.dryRun) {
      console.log('\n🔍 DRY RUN: No notifications sent')
    } else {
      console.log('\n✅ No alerts to send')
    }
    
    console.log('\n🎉 DORA metrics alerting completed!')
    
    // Exit with error code if there are critical alerts
    if (report.alerts.some(a => a.severity === 'critical')) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n💥 DORA metrics alerting failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { main, detectAlerts, generateAlertReport, formatAlertReport }
