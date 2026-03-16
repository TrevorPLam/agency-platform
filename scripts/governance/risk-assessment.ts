#!/usr/bin/env node

/**
 * Risk assessment tool for repository governance
 */

import { PropertyManager } from '@agency/governance'
import { RiskAssessmentEngine } from '@agency/governance/risk'
import { RepositoryProperties, RiskAssessment } from '@agency/governance/types'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface Config {
  token: string
  organization: string
}

function loadConfig(): Config {
  try {
    const configPath = resolve(__dirname, '../config.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Failed to load config.json:', error)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: npm run risk-assessment <command> [options]

Commands:
  assess <repo>                    Assess risk for a specific repository
  assess-all                       Assess risk for all repositories
  aggregate                        Generate aggregate risk report
  trend <repo>                     Show risk trend for repository
  compare <repo1> <repo2>          Compare risk between repositories
  validate                         Validate risk assessment configuration
  report                           Generate comprehensive risk report

Examples:
  npm run risk-assessment assess agency-platform
  npm run risk-assessment assess-all
  npm run risk-assessment aggregate
  npm run risk-assessment trend agency-platform
  npm run risk-assessment compare agency-platform client-app
  npm run risk-assessment validate
  npm run risk-assessment report
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const propertyManager = new PropertyManager(config.token, config.organization)
  const riskEngine = new RiskAssessmentEngine()

  try {
    switch (command) {
      case 'assess':
        await handleAssess(propertyManager, riskEngine, args[1])
        break
      case 'assess-all':
        await handleAssessAll(propertyManager, riskEngine)
        break
      case 'aggregate':
        await handleAggregate(propertyManager, riskEngine)
        break
      case 'trend':
        await handleTrend(propertyManager, riskEngine, args[1])
        break
      case 'compare':
        await handleCompare(propertyManager, riskEngine, args[1], args[2])
        break
      case 'validate':
        await handleValidate(riskEngine)
        break
      case 'report':
        await handleReport(propertyManager, riskEngine)
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

async function handleAssess(
  propertyManager: PropertyManager, 
  riskEngine: RiskAssessmentEngine, 
  repo: string
) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  const properties = await propertyManager.getRepositoryProperties(repo)
  
  // Ensure all required properties are present
  const completeProperties = ensureCompleteProperties(properties)
  
  const assessment = riskEngine.calculateRiskScore(completeProperties)
  
  console.log(`Risk Assessment for ${repo}`)
  console.log('==========================')
  console.log()
  console.log(`Overall Risk Score: ${assessment.score}`)
  console.log(`Risk Category: ${assessment.category}`)
  console.log(`Assessed: ${assessment.last_assessed}`)
  console.log()
  
  console.log('Risk Factors:')
  assessment.factors.forEach(factor => {
    const bar = generateProgressBar(factor.value, 4)
    console.log(`  ${factor.factor}: ${bar} ${factor.value.toFixed(1)} (${(factor.weight * 100).toFixed(0)}% weight)`)
  })
  console.log()
  
  if (assessment.recommendations.length > 0) {
    console.log('Recommendations:')
    assessment.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
    console.log()
  }
  
  // Save assessment
  const assessments = loadPreviousAssessments()
  assessments[repo] = assessment
  saveAssessments(assessments)
  
  console.log(`Assessment saved for trend analysis`)
}

async function handleAssessAll(propertyManager: PropertyManager, riskEngine: RiskAssessmentEngine) {
  const repositories = await propertyManager.getAllRepositoriesWithProperties()
  const assessments: Record<string, RiskAssessment> = {}
  
  console.log(`Assessing risk for ${repositories.length} repositories...`)
  console.log()
  
  for (const repo of repositories) {
    try {
      const completeProperties = ensureCompleteProperties(repo.custom_properties || {})
      const assessment = riskEngine.calculateRiskScore(completeProperties)
      assessments[repo.name] = assessment
      
      const category = assessment.category
      const icon = getCategoryIcon(category)
      console.log(`${icon} ${repo.name}: ${assessment.score.toFixed(2)} (${category})`)
    } catch (error) {
      console.error(`❌ ${repo.name}: Failed to assess - ${error}`)
    }
  }
  
  console.log()
  
  // Save all assessments
  saveAssessments(assessments)
  
  // Show summary
  const aggregate = riskEngine.aggregateRiskScores(assessments)
  console.log('Summary:')
  console.log(`  Total repositories: ${aggregate.totalRepositories}`)
  console.log(`  Average risk score: ${aggregate.averageScore}`)
  console.log(`  Distribution: ${JSON.stringify(aggregate.distribution)}`)
  console.log(`  High risk: ${aggregate.highRiskRepositories.length}`)
  console.log(`  Critical risk: ${aggregate.criticalRiskRepositories.length}`)
}

async function handleAggregate(propertyManager: PropertyManager, riskEngine: RiskAssessmentEngine) {
  const assessments = loadPreviousAssessments()
  
  if (Object.keys(assessments).length === 0) {
    console.log('No previous assessments found. Run "assess-all" first.')
    process.exit(0)
  }
  
  const aggregate = riskEngine.aggregateRiskScores(assessments)
  
  console.log('Aggregate Risk Assessment')
  console.log('========================')
  console.log()
  console.log(`Total repositories: ${aggregate.totalRepositories}`)
  console.log(`Average risk score: ${aggregate.averageScore}`)
  console.log()
  
  console.log('Risk Distribution:')
  Object.entries(aggregate.distribution).forEach(([category, count]) => {
    const percentage = ((count / aggregate.totalRepositories) * 100).toFixed(1)
    const icon = getCategoryIcon(category as any)
    console.log(`  ${icon} ${category}: ${count} (${percentage}%)`)
  })
  console.log()
  
  if (aggregate.highRiskRepositories.length > 0) {
    console.log('High Risk Repositories:')
    aggregate.highRiskRepositories.forEach(repo => {
      const score = assessments[repo].score
      console.log(`  ⚠️  ${repo}: ${score.toFixed(2)}`)
    })
    console.log()
  }
  
  if (aggregate.criticalRiskRepositories.length > 0) {
    console.log('Critical Risk Repositories:')
    aggregate.criticalRiskRepositories.forEach(repo => {
      const score = assessments[repo].score
      console.log(`  🚨 ${repo}: ${score.toFixed(2)}`)
    })
    console.log()
  }
  
  if (aggregate.recommendations.length > 0) {
    console.log('Aggregate Recommendations:')
    aggregate.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
  }
}

async function handleTrend(propertyManager: PropertyManager, riskEngine: RiskAssessmentEngine, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }
  
  const assessments = loadPreviousAssessments()
  const currentAssessment = assessments[repo]
  
  if (!currentAssessment) {
    console.log(`No assessment found for ${repo}. Run "assess ${repo}" first.`)
    process.exit(0)
  }
  
  // For trend analysis, we would need historical data
  // For now, show current assessment and explain trend tracking
  console.log(`Risk Trend for ${repo}`)
  console.log('===================')
  console.log()
  console.log('Current Assessment:')
  console.log(`  Score: ${currentAssessment.score}`)
  console.log(`  Category: ${currentAssessment.category}`)
  console.log(`  Last assessed: ${currentAssessment.last_assessed}`)
  console.log()
  
  console.log('Note: Trend tracking requires multiple assessments over time.')
  console.log('Run assessments periodically to track risk trends.')
  
  // Show factors that could influence future trends
  console.log()
  console.log('Risk Factors to Monitor:')
  currentAssessment.factors.forEach(factor => {
    if (factor.value >= 3.0) {
      console.log(`  📊 ${factor.factor}: ${factor.value.toFixed(1)} (High impact)`)
    }
  })
}

async function handleCompare(
  propertyManager: PropertyManager, 
  riskEngine: RiskAssessmentEngine, 
  repo1: string, 
  repo2: string
) {
  if (!repo1 || !repo2) {
    console.error('Two repository names are required')
    process.exit(1)
  }
  
  const assessments = loadPreviousAssessments()
  const assessment1 = assessments[repo1]
  const assessment2 = assessments[repo2]
  
  if (!assessment1 || !assessment2) {
    console.log('Assessments not found for both repositories.')
    console.log('Run "assess-all" or individual assessments first.')
    process.exit(0)
  }
  
  console.log(`Risk Comparison: ${repo1} vs ${repo2}`)
  console.log('=====================================')
  console.log()
  
  console.log(`${repo1}:`)
  console.log(`  Score: ${assessment1.score.toFixed(2)} (${assessment1.category})`)
  console.log()
  
  console.log(`${repo2}:`)
  console.log(`  Score: ${assessment2.score.toFixed(2)} (${assessment2.category})`)
  console.log()
  
  const scoreDiff = assessment1.score - assessment2.score
  const higher = scoreDiff > 0 ? repo1 : repo2
  
  console.log(`Comparison:`)
  console.log(`  ${higher} has higher risk score by ${Math.abs(scoreDiff).toFixed(2)}`)
  console.log(`  Category difference: ${assessment1.category} vs ${assessment2.category}`)
  console.log()
  
  // Compare factors
  console.log('Factor Comparison:')
  assessment1.factors.forEach(factor1 => {
    const factor2 = assessment2.factors.find(f => f.factor === factor1.factor)
    if (factor2) {
      const diff = factor1.value - factor2.value
      const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
      console.log(`  ${factor1.factor}: ${arrow} ${factor1.value.toFixed(1)} vs ${factor2.value.toFixed(1)}`)
    }
  })
}

async function handleValidate(riskEngine: RiskAssessmentEngine) {
  const validation = riskEngine.validateConfiguration()
  
  console.log('Risk Assessment Configuration Validation')
  console.log('========================================')
  console.log()
  
  console.log(`Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log()
  
  if (validation.errors.length > 0) {
    console.log('Errors:')
    validation.errors.forEach(error => console.log(`  ❌ ${error}`))
    console.log()
  }
  
  if (validation.warnings.length > 0) {
    console.log('Warnings:')
    validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`))
    console.log()
  }
  
  if (validation.valid && validation.warnings.length === 0) {
    console.log('✅ Configuration is valid and optimized')
  }
}

async function handleReport(propertyManager: PropertyManager, riskEngine: RiskAssessmentEngine) {
  const assessments = loadPreviousAssessments()
  
  if (Object.keys(assessments).length === 0) {
    console.log('No assessments found. Run "assess-all" first.')
    process.exit(0)
  }
  
  const aggregate = riskEngine.aggregateRiskScores(assessments)
  
  const report = {
    generated_at: new Date().toISOString(),
    organization: propertyManager['organization'],
    summary: {
      total_repositories: aggregate.totalRepositories,
      average_risk_score: aggregate.averageScore,
      risk_distribution: aggregate.distribution,
      high_risk_count: aggregate.highRiskRepositories.length,
      critical_risk_count: aggregate.criticalRiskRepositories.length
    },
    repositories: Object.entries(assessments).map(([name, assessment]) => ({
      name,
      score: assessment.score,
      category: assessment.category,
      factors: assessment.factors,
      recommendations: assessment.recommendations,
      last_assessed: assessment.last_assessed
    })),
    aggregate_recommendations: aggregate.recommendations,
    high_risk_repositories: aggregate.highRiskRepositories,
    critical_risk_repositories: aggregate.criticalRiskRepositories
  }
  
  // Save comprehensive report
  writeFileSync('risk-assessment-report.json', JSON.stringify(report, null, 2))
  
  console.log('Comprehensive Risk Assessment Report')
  console.log('=====================================')
  console.log()
  console.log(`Generated: ${report.generated_at}`)
  console.log(`Organization: ${report.organization}`)
  console.log()
  
  console.log('Executive Summary:')
  console.log(`  Total repositories: ${report.summary.total_repositories}`)
  console.log(`  Average risk score: ${report.summary.average_risk_score}`)
  console.log(`  High risk repositories: ${report.summary.high_risk_count}`)
  console.log(`  Critical risk repositories: ${report.summary.critical_risk_count}`)
  console.log()
  
  console.log('Risk Distribution:')
  Object.entries(report.summary.risk_distribution).forEach(([category, count]) => {
    const percentage = ((count / report.summary.total_repositories) * 100).toFixed(1)
    const icon = getCategoryIcon(category as any)
    console.log(`  ${icon} ${category}: ${count} (${percentage}%)`)
  })
  console.log()
  
  if (report.aggregate_recommendations.length > 0) {
    console.log('Key Recommendations:')
    report.aggregate_recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
    console.log()
  }
  
  console.log('Detailed report saved to: risk-assessment-report.json')
}

// Helper functions

function ensureCompleteProperties(properties: Partial<RepositoryProperties>): RepositoryProperties {
  return {
    business_criticality: properties.business_criticality || 'Medium',
    owner_team: properties.owner_team || 'unknown',
    service_tier: properties.service_tier || 'Application',
    client_name: properties.client_name,
    public_facing: properties.public_facing || false,
    compliance_frameworks: properties.compliance_frameworks || [],
    data_classification: properties.data_classification || 'Internal',
    environment: properties.environment || 'Development',
    security_classification: properties.security_classification || 'Standard',
    tech_stack: properties.tech_stack || [],
    architecture_pattern: properties.architecture_pattern || 'Library',
    dependencies: properties.dependencies || 'Mixed',
    build_system: properties.build_system || 'Turborepo',
    lifecycle_stage: properties.lifecycle_stage || 'Development',
    last_security_review: properties.last_security_review,
    review_frequency: properties.review_frequency || 'Quarterly',
    automated_tests: properties.automated_tests ?? true,
    ci_cd_enabled: properties.ci_cd_enabled ?? true
  }
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Critical': return '🚨'
    case 'High': return '⚠️'
    case 'Medium': return '📊'
    case 'Low': return '✅'
    default: return '❓'
  }
}

function generateProgressBar(value: number, max: number): string {
  const filled = Math.round((value / max) * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function loadPreviousAssessments(): Record<string, RiskAssessment> {
  try {
    const data = readFileSync(resolve(__dirname, '../assessments.json'), 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

function saveAssessments(assessments: Record<string, RiskAssessment>): void {
  try {
    writeFileSync(resolve(__dirname, '../assessments.json'), JSON.stringify(assessments, null, 2))
  } catch (error) {
    console.warn('Failed to save assessments:', error)
  }
}

if (require.main === module) {
  main()
}
