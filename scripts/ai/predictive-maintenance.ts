#!/usr/bin/env tsx

import { program } from 'commander'
import winston from 'winston'

// ============================================================================
// Predictive Maintenance CLI
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
  .name('predictive-maintenance')
  .description('AI-powered predictive maintenance for repository health')
  .version('1.0.0')

// Analyze Repository Health Command
program
  .command('analyze-health')
  .description('Analyze repository health and predict maintenance needs')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .option('--days <days>', 'Analysis period in days', '30')
  .option('--output <output>', 'Output format (json|markdown)', 'markdown')
  .action(async (options) => {
    try {
      const analysis = await analyzeRepositoryHealth(options.owner, options.repo, parseInt(options.days))
      
      logger.info('Repository health analysis completed', {
        repository: `${options.owner}/${options.repo}`,
        healthScore: analysis.healthScore,
        riskFactors: analysis.riskFactors.length
      })

      const output = formatHealthOutput(analysis, options.output)
      console.log(output)

    } catch (error) {
      logger.error('Failed to analyze repository health', { error })
      process.exit(1)
    }
  })

// Predict Issues Command
program
  .command('predict-issues')
  .description('Predict potential issues based on repository patterns')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .option('--horizon <horizon>', 'Prediction horizon in days', '14')
  .action(async (options) => {
    try {
      const predictions = await predictIssues(options.owner, options.repo, parseInt(options.horizon))
      
      logger.info('Issue prediction completed', {
        repository: `${options.owner}/${options.repo}`,
        predictedIssues: predictions.length,
        horizon: `${options.horizon} days`
      })

      console.log('=== Predicted Issues ===')
      predictions.forEach((prediction, index) => {
        console.log(`\n${index + 1}. ${prediction.title}`)
        console.log(`   Type: ${prediction.type}`)
        console.log(`   Probability: ${(prediction.probability * 100).toFixed(1)}%`)
        console.log(`   Impact: ${prediction.impact}`)
        console.log(`   Timeline: ${prediction.timeline}`)
        console.log(`   Description: ${prediction.description}`)
        if (prediction.prevention) {
          console.log(`   Prevention: ${prediction.prevention}`)
        }
      })

    } catch (error) {
      logger.error('Failed to predict issues', { error })
      process.exit(1)
    }
  })

// Monitor Trends Command
program
  .command('monitor-trends')
  .description('Monitor repository trends and patterns')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .option('--metric <metric>', 'Specific metric to monitor')
  .option('--period <period>', 'Monitoring period', '7d')
  .action(async (options) => {
    try {
      const trends = await monitorTrends(options.owner, options.repo, options.metric, options.period)
      
      logger.info('Trend monitoring completed', {
        repository: `${options.owner}/${options.repo}`,
        metrics: trends.length
      })

      console.log('=== Repository Trends ===')
      trends.forEach(trend => {
        console.log(`\n${trend.metric}:`)
        console.log(`   Current: ${trend.current}`)
        console.log(`   Previous: ${trend.previous}`)
        console.log(`   Change: ${trend.change > 0 ? '+' : ''}${trend.change}%`)
        console.log(`   Trend: ${trend.direction}`)
        console.log(`   Status: ${trend.status}`)
      })

    } catch (error) {
      logger.error('Failed to monitor trends', { error })
      process.exit(1)
    }
  })

// ============================================================================
// Analysis Functions
// ============================================================================

async function analyzeRepositoryHealth(owner: string, repo: string, days: number) {
  // Mock implementation - in production, fetch real data from GitHub API
  const mockData = {
    commitFrequency: 15.2,
    prMergeRate: 0.85,
    testCoverage: 0.72,
    codeChurn: 0.15,
    technicalDebt: 0.23,
    bugRate: 0.08,
    buildSuccessRate: 0.94,
    reviewTime: 2.3
  }

  // Calculate health score (0-100)
  const healthScore = calculateHealthScore(mockData)

  // Identify risk factors
  const riskFactors = identifyRiskFactors(mockData)

  // Generate recommendations
  const recommendations = generateRecommendations(mockData, riskFactors)

  return {
    repository: `${owner}/${repo}`,
    analysisPeriod: `${days} days`,
    healthScore,
    metrics: mockData,
    riskFactors,
    recommendations,
    lastUpdated: new Date().toISOString()
  }
}

async function predictIssues(owner: string, repo: string, horizon: number) {
  // Mock implementation - in production, use ML models for prediction
  const mockPredictions = [
    {
      title: 'High Code Churn Detected',
      type: 'maintainability',
      probability: 0.78,
      impact: 'medium',
      timeline: `${horizon - 2}-${horizon} days`,
      description: 'Recent changes show high code churn which may lead to bugs',
      prevention: 'Consider code freezes and more thorough testing'
    },
    {
      title: 'Test Coverage Decline',
      type: 'quality',
      probability: 0.65,
      impact: 'high',
      timeline: `${horizon - 5}-${horizon} days`,
      description: 'Test coverage has been declining over recent commits',
      prevention: 'Implement coverage gates and require tests for new features'
    },
    {
      title: 'Dependency Security Risk',
      type: 'security',
      probability: 0.42,
      impact: 'critical',
      timeline: `${horizon - 7}-${horizon} days`,
      description: 'Outdated dependencies may have security vulnerabilities',
      prevention: 'Update dependencies and run security scans'
    },
    {
      title: 'Build Performance Degradation',
      type: 'performance',
      probability: 0.55,
      impact: 'medium',
      timeline: `${horizon - 3}-${horizon} days`,
      description: 'Build times have been increasing steadily',
      prevention: 'Optimize build pipeline and consider build caching'
    }
  ]

  return mockPredictions.filter(p => p.probability > 0.4)
}

async function monitorTrends(owner: string, repo: string, metric?: string, period: string = '7d') {
  // Mock implementation - in production, fetch real trend data
  const allTrends = [
    {
      metric: 'Commit Frequency',
      current: 15.2,
      previous: 18.7,
      change: -18.7,
      direction: 'decreasing',
      status: 'warning'
    },
    {
      metric: 'PR Merge Rate',
      current: 0.85,
      previous: 0.82,
      change: 3.7,
      direction: 'increasing',
      status: 'good'
    },
    {
      metric: 'Test Coverage',
      current: 0.72,
      previous: 0.75,
      change: -4.0,
      direction: 'decreasing',
      status: 'warning'
    },
    {
      metric: 'Build Success Rate',
      current: 0.94,
      previous: 0.91,
      change: 3.3,
      direction: 'increasing',
      status: 'good'
    },
    {
      metric: 'Code Review Time',
      current: 2.3,
      previous: 2.8,
      change: -17.9,
      direction: 'decreasing',
      status: 'good'
    }
  ]

  if (metric) {
    return allTrends.filter(t => t.metric.toLowerCase().includes(metric.toLowerCase()))
  }

  return allTrends
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateHealthScore(metrics: any): number {
  const weights = {
    commitFrequency: 0.15,
    prMergeRate: 0.20,
    testCoverage: 0.20,
    codeChurn: -0.15, // Negative weight
    technicalDebt: -0.20, // Negative weight
    bugRate: -0.15, // Negative weight
    buildSuccessRate: 0.15,
    reviewTime: -0.10 // Negative weight (lower is better)
  }

  let score = 50 // Base score

  Object.entries(weights).forEach(([metric, weight]) => {
    const value = metrics[metric]
    if (weight > 0) {
      score += value * weight * 100
    } else {
      score -= value * Math.abs(weight) * 100
    }
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

function identifyRiskFactors(metrics: any): Array<{ type: string; severity: string; description: string }> {
  const riskFactors = []

  if (metrics.testCoverage < 0.7) {
    riskFactors.push({
      type: 'quality',
      severity: 'high',
      description: `Low test coverage: ${(metrics.testCoverage * 100).toFixed(1)}%`
    })
  }

  if (metrics.codeChurn > 0.2) {
    riskFactors.push({
      type: 'maintainability',
      severity: 'medium',
      description: `High code churn: ${(metrics.codeChurn * 100).toFixed(1)}%`
    })
  }

  if (metrics.technicalDebt > 0.3) {
    riskFactors.push({
      type: 'technical',
      severity: 'high',
      description: `High technical debt: ${(metrics.technicalDebt * 100).toFixed(1)}%`
    })
  }

  if (metrics.bugRate > 0.1) {
    riskFactors.push({
      type: 'quality',
      severity: 'medium',
      description: `High bug rate: ${(metrics.bugRate * 100).toFixed(1)}%`
    })
  }

  if (metrics.buildSuccessRate < 0.9) {
    riskFactors.push({
      type: 'reliability',
      severity: 'high',
      description: `Low build success rate: ${(metrics.buildSuccessRate * 100).toFixed(1)}%`
    })
  }

  if (metrics.reviewTime > 3) {
    riskFactors.push({
      type: 'process',
      severity: 'low',
      description: `Slow code review: ${metrics.reviewTime} days average`
    })
  }

  return riskFactors
}

function generateRecommendations(metrics: any, riskFactors: any[]): string[] {
  const recommendations = []

  if (metrics.testCoverage < 0.8) {
    recommendations.push('Improve test coverage by adding unit and integration tests')
  }

  if (metrics.codeChurn > 0.15) {
    recommendations.push('Reduce code churn through better architecture and smaller PRs')
  }

  if (metrics.technicalDebt > 0.25) {
    recommendations.push('Address technical debt with regular refactoring sprints')
  }

  if (metrics.bugRate > 0.05) {
    recommendations.push('Implement more rigorous testing and code review processes')
  }

  if (metrics.buildSuccessRate < 0.95) {
    recommendations.push('Investigate and fix build failures to improve reliability')
  }

  if (metrics.reviewTime > 2) {
    recommendations.push('Streamline code review process with automated checks')
  }

  if (metrics.prMergeRate < 0.8) {
    recommendations.push('Improve PR process to increase merge rate')
  }

  return recommendations
}

function formatHealthOutput(analysis: any, format: string): string {
  if (format === 'json') {
    return JSON.stringify(analysis, null, 2)
  }

  // Markdown format
  let output = `# Repository Health Analysis\n\n`
  
  output += `**Repository**: ${analysis.repository}\n`
  output += `**Analysis Period**: ${analysis.analysisPeriod}\n`
  output += `**Health Score**: ${analysis.healthScore}/100\n`
  output += `**Last Updated**: ${new Date(analysis.lastUpdated).toLocaleDateString()}\n\n`

  // Health score indicator
  const healthEmoji = analysis.healthScore >= 80 ? '🟢' : analysis.healthScore >= 60 ? '🟡' : '🔴'
  output += `## Overall Health ${healthEmoji}\n\n`

  // Key metrics
  output += `## Key Metrics\n\n`
  output += `| Metric | Value | Status |\n`
  output += `|--------|-------|---------|\n`
  
  Object.entries(analysis.metrics).forEach(([key, value]: [string, any]) => {
    const formattedValue = typeof value === 'number' && value < 1 ? 
      `${(value * 100).toFixed(1)}%` : 
      value.toString()
    
    let status = '🟢'
    if (key === 'codeChurn' || key === 'technicalDebt' || key === 'bugRate') {
      status = value > 0.2 ? '🔴' : value > 0.1 ? '🟡' : '🟢'
    } else {
      status = value < 0.7 ? '🔴' : value < 0.85 ? '🟡' : '🟢'
    }
    
    output += `| ${formatMetricName(key)} | ${formattedValue} | ${status} |\n`
  })
  
  output += '\n'

  // Risk factors
  if (analysis.riskFactors.length > 0) {
    output += `## Risk Factors\n\n`
    analysis.riskFactors.forEach((risk: any, index: number) => {
      const severityEmoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢'
      output += `${index + 1}. ${severityEmoji} **${risk.type}**: ${risk.description}\n`
    })
    output += '\n'
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    output += `## Recommendations\n\n`
    analysis.recommendations.forEach((rec: string, index: number) => {
      output += `${index + 1}. ${rec}\n`
    })
    output += '\n'
  }

  output += `---\n`
  output += `*Generated by AI Predictive Maintenance*\n`

  return output
}

function formatMetricName(key: string): string {
  return key.split(/(?=[A-Z])/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Parse command line arguments
program.parse()
