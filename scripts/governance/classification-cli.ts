#!/usr/bin/env node

/**
 * Classification CLI Tool
 * 
 * Command-line interface for repository classification and analysis
 */

import { ClassificationEngine } from '@agency/governance'
import { DynamicPolicyEngine } from '@agency/governance'
import { AutoLabelingEngine } from '@agency/governance'
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
    console.error('Please create config.json with token and organization')
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: npm run classification <command> [options]

Commands:
  analyze <repo>                    Analyze repository classification
  classify <repo>                   Classify and apply policies
  classify-org                      Classify entire organization
  auto-label <repo>                 Apply auto-labels to repository
  auto-label-org                    Apply auto-labels to organization
  report <repo>                     Generate classification report
  report-org                        Generate organization report
  metrics                           Show classification metrics
  dry-run <repo>                    Dry run classification (no changes)

Examples:
  npm run classification analyze agency-platform
  npm run classification classify client-app
  npm run classification auto-label agency-platform
  npm run classification report client-app
  npm run classification classify-org
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const classificationEngine = new ClassificationEngine(config.token, config.organization)
  const policyEngine = new DynamicPolicyEngine(config.token, config.organization)
  const labelingEngine = new AutoLabelingEngine(config.token, config.organization)

  try {
    switch (command) {
      case 'analyze':
        await handleAnalyze(classificationEngine, args[1])
        break
      case 'classify':
        await handleClassify(classificationEngine, policyEngine, args[1])
        break
      case 'classify-org':
        await handleClassifyOrganization(classificationEngine, policyEngine)
        break
      case 'auto-label':
        await handleAutoLabel(classificationEngine, labelingEngine, args[1])
        break
      case 'auto-label-org':
        await handleAutoLabelOrganization(classificationEngine, labelingEngine)
        break
      case 'report':
        await handleReport(classificationEngine, args[1])
        break
      case 'report-org':
        await handleReportOrganization(classificationEngine)
        break
      case 'metrics':
        await handleMetrics(classificationEngine, policyEngine, labelingEngine)
        break
      case 'dry-run':
        await handleDryRun(classificationEngine, policyEngine, labelingEngine, args[1])
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

async function handleAnalyze(classificationEngine: ClassificationEngine, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  console.log(`🔍 Analyzing repository: ${repo}`)
  console.log()

  const analysis = await classificationEngine.analyzeRepository(repo)

  console.log('=== Repository Classification ===')
  console.log(`Category: ${analysis.classification.category}`)
  console.log(`Subcategory: ${analysis.classification.subcategory}`)
  console.log(`Confidence: ${(analysis.classification.confidence * 100).toFixed(1)}%`)
  console.log(`Risk Level: ${analysis.classification.riskLevel}`)
  console.log()

  console.log('=== Business Classification ===')
  console.log(`Business Criticality: ${analysis.classification.businessCriticality}`)
  console.log(`Service Tier: ${analysis.classification.serviceTier}`)
  console.log(`Data Classification: ${analysis.classification.dataClassification}`)
  console.log(`Security Classification: ${analysis.classification.securityClassification}`)
  console.log()

  console.log('=== Compliance Frameworks ===')
  if (analysis.classification.recommendedFrameworks.length > 0) {
    analysis.classification.recommendedFrameworks.forEach(framework => {
      console.log(`- ${framework}`)
    })
  } else {
    console.log('No specific compliance frameworks required')
  }
  console.log()

  console.log('=== Risk Assessment ===')
  console.log(`Risk Score: ${analysis.riskAssessment.score.toFixed(1)}/100`)
  console.log(`Risk Category: ${analysis.riskAssessment.category}`)
  console.log(`Factors: ${analysis.riskAssessment.factors.length}`)
  console.log(`Recommendations: ${analysis.riskAssessment.recommendations.length}`)
  console.log()

  console.log('=== File Structure Analysis ===')
  console.log(`Total Files: ${analysis.fileStructure.totalFiles}`)
  console.log(`Directories: ${analysis.fileStructure.directories.length}`)
  console.log(`Frameworks: ${analysis.fileStructure.frameworkIndicators.length}`)
  console.log(`Security Indicators: ${analysis.fileStructure.securityIndicators.length}`)
  console.log(`Compliance Indicators: ${analysis.fileStructure.complianceIndicators.length}`)
  console.log()

  console.log('=== Framework Indicators ===')
  analysis.fileStructure.frameworkIndicators.forEach(indicator => {
    console.log(`- ${indicator.framework} (${(indicator.confidence * 100).toFixed(1)}% confidence)`)
  })
  console.log()

  console.log('=== Architecture Patterns ===')
  analysis.fileStructure.architecturePatterns.forEach(pattern => {
    console.log(`- ${pattern.pattern} (${(pattern.confidence * 100).toFixed(1)}% confidence)`)
  })
  console.log()

  console.log('=== Recommended Properties ===')
  Object.entries(analysis.recommendedProperties).forEach(([key, value]) => {
    if (value !== undefined) {
      console.log(`${key}: ${JSON.stringify(value)}`)
    }
  })
  console.log()

  // Save detailed analysis to file
  const reportPath = resolve(process.cwd(), `${repo}-classification-report.json`)
  writeFileSync(reportPath, JSON.stringify(analysis, null, 2))
  console.log(`📄 Detailed analysis saved to: ${reportPath}`)
}

async function handleClassify(
  classificationEngine: ClassificationEngine, 
  policyEngine: DynamicPolicyEngine, 
  repo: string
) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  console.log(`🏷️  Classifying and applying policies to: ${repo}`)
  console.log()

  // First analyze the repository
  const analysis = await classificationEngine.analyzeRepository(repo)

  // Apply policies based on classification
  const policyApplication = await policyEngine.analyzeAndApplyPolicies(repo, false)

  console.log('=== Classification Results ===')
  console.log(`Category: ${analysis.classification.category}`)
  console.log(`Risk Level: ${analysis.classification.riskLevel}`)
  console.log(`Business Criticality: ${analysis.classification.businessCriticality}`)
  console.log()

  console.log('=== Policy Application ===')
  console.log(`Status: ${policyApplication.status}`)
  console.log(`Policies Applied: ${policyApplication.policies.length}`)
  console.log(`Rulesets Created: ${policyApplication.rulesets.length}`)
  console.log(`Applied At: ${policyApplication.appliedAt}`)
  console.log()

  if (policyApplication.errors.length > 0) {
    console.log('=== Errors ===')
    policyApplication.errors.forEach(error => {
      console.log(`❌ ${error}`)
    })
    console.log()
  }

  console.log('=== Applied Policies ===')
  policyApplication.policies.forEach(policyId => {
    console.log(`✅ ${policyId}`)
  })
  console.log()

  console.log('=== Created Rulesets ===')
  policyApplication.rulesets.forEach(rulesetId => {
    console.log(`📋 ${rulesetId}`)
  })
}

async function handleClassifyOrganization(
  classificationEngine: ClassificationEngine, 
  policyEngine: DynamicPolicyEngine
) {
  console.log(`🏷️  Classifying entire organization: ${classificationEngine['organization']}`)
  console.log()

  const applications = await policyEngine.applyPoliciesToOrganization(false)

  console.log('=== Organization Classification Summary ===')
  console.log(`Total Repositories: ${applications.length}`)
  console.log(`Successful: ${applications.filter(a => a.status === 'applied').length}`)
  console.log(`Failed: ${applications.filter(a => a.status === 'failed').length}`)
  console.log()

  console.log('=== Repository Results ===')
  applications.forEach(application => {
    const status = application.status === 'applied' ? '✅' : '❌'
    console.log(`${status} ${application.repository}: ${application.policies.length} policies`)
    
    if (application.errors.length > 0) {
      application.errors.forEach(error => {
        console.log(`    ❌ ${error}`)
      })
    }
  })

  // Save detailed report
  const reportPath = resolve(process.cwd(), 'organization-classification-report.json')
  writeFileSync(reportPath, JSON.stringify(applications, null, 2))
  console.log()
  console.log(`📄 Detailed report saved to: ${reportPath}`)
}

async function handleAutoLabel(
  classificationEngine: ClassificationEngine, 
  labelingEngine: AutoLabelingEngine, 
  repo: string
) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  console.log(`🏷️  Auto-labeling repository: ${repo}`)
  console.log()

  const analysis = await classificationEngine.analyzeRepository(repo)
  const labelApplication = await labelingEngine.analyzeAndApplyLabels(repo, analysis)

  console.log('=== Labeling Results ===')
  console.log(`Labels Applied: ${labelApplication.labels.length}`)
  console.log(`Labels Removed: ${labelApplication.removedLabels.length}`)
  console.log(`Confidence: ${(labelApplication.confidence * 100).toFixed(1)}%`)
  console.log()

  if (labelApplication.labels.length > 0) {
    console.log('=== Applied Labels ===')
    labelApplication.labels.forEach(label => {
      console.log(`✅ ${label}`)
    })
    console.log()
  }

  if (labelApplication.removedLabels.length > 0) {
    console.log('=== Removed Labels ===')
    labelApplication.removedLabels.forEach(label => {
      console.log(`🗑️  ${label}`)
    })
    console.log()
  }

  console.log('=== Reasoning ===')
  labelApplication.reasoning.forEach(reason => {
    console.log(`💡 ${reason}`)
  })
}

async function handleAutoLabelOrganization(
  classificationEngine: ClassificationEngine, 
  labelingEngine: AutoLabelingEngine
) {
  console.log(`🏷️  Auto-labeling entire organization: ${classificationEngine['organization']}`)
  console.log()

  // Get all repositories in the organization
  const { octokit, organization } = classificationEngine as any
  const { data: repos } = await octokit.rest.repos.listForOrg({
    org: organization,
    type: 'all',
    per_page: 100
  })

  console.log(`Processing ${repos.length} repositories...`)
  console.log()

  let successCount = 0
  let failureCount = 0

  for (const repo of repos) {
    try {
      const analysis = await classificationEngine.analyzeRepository(repo.name)
      await labelingEngine.analyzeAndApplyLabels(repo.name, analysis)
      console.log(`✅ ${repo.name}: Labeled successfully`)
      successCount++
    } catch (error) {
      console.log(`❌ ${repo.name}: Failed to label - ${error}`)
      failureCount++
    }
  }

  console.log()
  console.log('=== Auto-Labeling Summary ===')
  console.log(`Total Repositories: ${repos.length}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${failureCount}`)
  console.log()

  // Show metrics
  const metrics = labelingEngine.getLabelingMetrics()
  console.log('=== Labeling Metrics ===')
  console.log(`Labeled Repositories: ${metrics.labeledRepositories}`)
  console.log(`Total Labels Applied: ${metrics.totalLabelsApplied}`)
  console.log(`Average Labels per Repository: ${metrics.averageLabelsPerRepository.toFixed(1)}`)
  console.log(`Average Confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`)
  console.log()

  console.log('=== Top Labels ===')
  metrics.topLabels.slice(0, 10).forEach(({ label, count }) => {
    console.log(`${label}: ${count}`)
  })
}

async function handleReport(classificationEngine: ClassificationEngine, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  console.log(`📊 Generating classification report for: ${repo}`)
  console.log()

  const analysis = await classificationEngine.analyzeRepository(repo)

  console.log('=== Repository Classification Report ===')
  console.log(`Repository: ${analysis.repository.full_name}`)
  console.log(`Generated: ${new Date().toISOString()}`)
  console.log()

  console.log('=== Executive Summary ===')
  console.log(`Category: ${analysis.classification.category}`)
  console.log(`Risk Level: ${analysis.classification.riskLevel}`)
  console.log(`Business Criticality: ${analysis.classification.businessCriticality}`)
  console.log(`Compliance Score: ${((analysis.riskAssessment.factors.length > 0 ? 100 - analysis.riskAssessment.score : 100)).toFixed(1)}%`)
  console.log()

  console.log('=== Risk Factors ===')
  analysis.riskAssessment.factors.forEach(factor => {
    console.log(`- ${factor.factor}: ${(factor.contribution * 100).toFixed(1)}%`)
  })
  console.log()

  console.log('=== Recommendations ===')
  analysis.riskAssessment.recommendations.forEach((recommendation, index) => {
    console.log(`${index + 1}. ${recommendation}`)
  })
  console.log()

  console.log('=== Technology Stack ===')
  Object.entries(analysis.contentSignals.languages).forEach(([lang, bytes]) => {
    console.log(`- ${lang}: ${bytes} bytes`)
  })
  console.log()

  console.log('=== Frameworks Detected ===')
  analysis.fileStructure.frameworkIndicators.forEach(indicator => {
    console.log(`- ${indicator.framework}: ${(indicator.confidence * 100).toFixed(1)}%`)
  })
  console.log()

  // Save report to file
  const reportPath = resolve(process.cwd(), `${repo}-executive-report.md`)
  const reportContent = generateMarkdownReport(analysis)
  writeFileSync(reportPath, reportContent)
  console.log(`📄 Report saved to: ${reportPath}`)
}

async function handleReportOrganization(classificationEngine: ClassificationEngine) {
  console.log(`📊 Generating organization classification report`)
  console.log()

  // Get all repositories and analyze them
  const { octokit, organization } = classificationEngine as any
  const { data: repos } = await octokit.rest.repos.listForOrg({
    org: organization,
    type: 'all',
    per_page: 100
  })

  console.log(`Analyzing ${repos.length} repositories...`)
  console.log()

  const analyses = []
  let successCount = 0
  let failureCount = 0

  for (const repo of repos) {
    try {
      const analysis = await classificationEngine.analyzeRepository(repo.name)
      analyses.push(analysis)
      successCount++
    } catch (error) {
      console.log(`❌ ${repo.name}: Failed to analyze - ${error}`)
      failureCount++
    }
  }

  console.log('=== Organization Classification Summary ===')
  console.log(`Total Repositories: ${repos.length}`)
  console.log(`Successfully Analyzed: ${successCount}`)
  console.log(`Failed: ${failureCount}`)
  console.log()

  // Category distribution
  const categoryCounts: Record<string, number> = {}
  analyses.forEach(analysis => {
    categoryCounts[analysis.classification.category] = (categoryCounts[analysis.classification.category] || 0) + 1
  })

  console.log('=== Repository Categories ===')
  Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`${category}: ${count}`)
    })
  console.log()

  // Risk distribution
  const riskCounts: Record<string, number> = {}
  analyses.forEach(analysis => {
    riskCounts[analysis.classification.riskLevel] = (riskCounts[analysis.classification.riskLevel] || 0) + 1
  })

  console.log('=== Risk Distribution ===')
  ['Critical', 'High', 'Medium', 'Low'].forEach(level => {
    console.log(`${level}: ${riskCounts[level] || 0}`)
  })
  console.log()

  // High-risk repositories
  const highRiskRepos = analyses.filter(a => 
    a.classification.riskLevel === 'Critical' || a.classification.riskLevel === 'High'
  )

  if (highRiskRepos.length > 0) {
    console.log('=== High-Risk Repositories ===')
    highRiskRepos.forEach(analysis => {
      console.log(`🚨 ${analysis.repository.full_name}: ${analysis.classification.riskLevel} (${analysis.riskAssessment.score.toFixed(1)})`)
    })
    console.log()
  }

  // Save detailed report
  const reportPath = resolve(process.cwd(), 'organization-classification-report.md')
  const reportContent = generateOrganizationMarkdownReport(analyses)
  writeFileSync(reportPath, reportContent)
  console.log(`📄 Detailed report saved to: ${reportPath}`)
}

async function handleMetrics(
  classificationEngine: ClassificationEngine, 
  policyEngine: DynamicPolicyEngine, 
  labelingEngine: AutoLabelingEngine
) {
  console.log(`📊 Classification and Governance Metrics`)
  console.log()

  // Get policy compliance report
  const complianceReport = await policyEngine.getPolicyComplianceReport()
  
  console.log('=== Policy Compliance Metrics ===')
  console.log(`Total Repositories: ${complianceReport.totalRepositories}`)
  console.log(`Compliant Repositories: ${complianceReport.compliantRepositories}`)
  console.log(`Non-Compliant Repositories: ${complianceReport.nonCompliantRepositories}`)
  console.log(`Compliance Rate: ${((complianceReport.compliantRepositories / complianceReport.totalRepositories) * 100).toFixed(1)}%`)
  console.log()

  console.log('=== Policies by Category ===')
  Object.entries(complianceReport.policiesByCategory).forEach(([policy, count]) => {
    console.log(`${policy}: ${count}`)
  })
  console.log()

  // Get labeling metrics
  const labelingMetrics = labelingEngine.getLabelingMetrics()
  
  console.log('=== Labeling Metrics ===')
  console.log(`Labeled Repositories: ${labelingMetrics.labeledRepositories}`)
  console.log(`Total Labels Applied: ${labelingMetrics.totalLabelsApplied}`)
  console.log(`Average Labels per Repository: ${labelingMetrics.averageLabelsPerRepository.toFixed(1)}`)
  console.log(`Average Confidence: ${(labelingMetrics.averageConfidence * 100).toFixed(1)}%`)
  console.log()

  console.log('=== Labels by Category ===')
  Object.entries(labelingMetrics.labelsByCategory).forEach(([category, count]) => {
    console.log(`${category}: ${count}`)
  })
  console.log()

  console.log('=== Top Labels ===')
  labelingMetrics.topLabels.slice(0, 10).forEach(({ label, count }) => {
    console.log(`${label}: ${count}`)
  })
}

async function handleDryRun(
  classificationEngine: ClassificationEngine, 
  policyEngine: DynamicPolicyEngine, 
  labelingEngine: AutoLabelingEngine, 
  repo: string
) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  console.log(`🔍 Dry run for repository: ${repo}`)
  console.log('No changes will be applied.')
  console.log()

  // Analyze repository
  const analysis = await classificationEngine.analyzeRepository(repo)

  console.log('=== Classification Results ===')
  console.log(`Category: ${analysis.classification.category}`)
  console.log(`Risk Level: ${analysis.classification.riskLevel}`)
  console.log(`Business Criticality: ${analysis.classification.businessCriticality}`)
  console.log()

  // Simulate policy application
  const policyApplication = await policyEngine.analyzeAndApplyPolicies(repo, true)

  console.log('=== Policy Application (Dry Run) ===')
  console.log(`Policies to Apply: ${policyApplication.policies.length}`)
  console.log(`Rulesets to Create: ${policyApplication.rulesets.length}`)
  console.log()

  console.log('=== Policies to Apply ===')
  policyApplication.policies.forEach(policyId => {
    console.log(`📋 ${policyId}`)
  })
  console.log()

  // Simulate labeling
  labelingEngine.updateConfiguration({ dryRun: true })
  const labelApplication = await labelingEngine.analyzeAndApplyLabels(repo, analysis)

  console.log('=== Labeling (Dry Run) ===')
  console.log(`Labels to Apply: ${labelApplication.labels.length}`)
  console.log(`Labels to Remove: ${labelApplication.removedLabels.length}`)
  console.log(`Confidence: ${(labelApplication.confidence * 100).toFixed(1)}%`)
  console.log()

  if (labelApplication.labels.length > 0) {
    console.log('=== Labels to Apply ===')
    labelApplication.labels.forEach(label => {
      console.log(`🏷️  ${label}`)
    })
    console.log()
  }

  console.log('=== Recommended Properties ===')
  Object.entries(analysis.recommendedProperties).forEach(([key, value]) => {
    if (value !== undefined) {
      console.log(`${key}: ${JSON.stringify(value)}`)
    }
  })
  console.log()

  console.log('✅ Dry run completed. No changes were applied.')
}

function generateMarkdownReport(analysis: any): string {
  return `# Repository Classification Report

## Repository Information
- **Name**: ${analysis.repository.full_name}
- **Description**: ${analysis.repository.description || 'No description'}
- **Language**: ${analysis.repository.language || 'Unknown'}
- **Created**: ${new Date(analysis.repository.created_at).toLocaleDateString()}
- **Last Updated**: ${new Date(analysis.repository.updated_at).toLocaleDateString()}

## Executive Summary
- **Category**: ${analysis.classification.category}
- **Subcategory**: ${analysis.classification.subcategory}
- **Risk Level**: ${analysis.classification.riskLevel}
- **Business Criticality**: ${analysis.classification.businessCriticality}
- **Service Tier**: ${analysis.classification.serviceTier}
- **Confidence**: ${(analysis.classification.confidence * 100).toFixed(1)}%

## Risk Assessment
- **Risk Score**: ${analysis.riskAssessment.score.toFixed(1)}/100
- **Risk Category**: ${analysis.riskAssessment.category}
- **Assessment Date**: ${new Date(analysis.riskAssessment.last_assessed).toLocaleDateString()}

### Risk Factors
${analysis.riskAssessment.factors.map((factor: any) => 
  `- **${factor.factor}**: ${(factor.contribution * 100).toFixed(1)}% (Weight: ${factor.weight})`
).join('\n')}

### Recommendations
${analysis.riskAssessment.recommendations.map((rec: string, index: number) => 
  `${index + 1}. ${rec}`
).join('\n')}

## Technology Stack
${Object.entries(analysis.contentSignals.languages).map(([lang, bytes]) => 
  `- **${lang}**: ${bytes} bytes`
).join('\n')}

## Frameworks Detected
${analysis.fileStructure.frameworkIndicators.map((indicator: any) => 
  `- **${indicator.framework}**: ${(indicator.confidence * 100).toFixed(1)}% confidence`
).join('\n')}

## Architecture Patterns
${analysis.fileStructure.architecturePatterns.map((pattern: any) => 
  `- **${pattern.pattern}**: ${(pattern.confidence * 100).toFixed(1)}% confidence`
).join('\n')}

## Security Indicators
${analysis.fileStructure.securityIndicators.length > 0 ? 
  analysis.fileStructure.securityIndicators.map((indicator: any) => 
    `- **${indicator.type}**: ${indicator.present ? 'Present' : 'Absent'} (${(indicator.confidence * 100).toFixed(1)}% confidence)`
  ).join('\n') : 'No security indicators detected'
}

## Compliance Frameworks
${analysis.classification.recommendedFrameworks.length > 0 ?
  analysis.classification.recommendedFrameworks.map((framework: string) => 
    `- **${framework}**`
  ).join('\n') : 'No specific compliance frameworks required'
}

## Recommended Properties
${Object.entries(analysis.recommendedProperties).map(([key, value]) => 
  value !== undefined ? `- **${key}**: ${JSON.stringify(value)}` : ''
).filter(Boolean).join('\n')}

---
*Report generated on ${new Date().toISOString()}*
`
}

function generateOrganizationMarkdownReport(analyses: any[]): string {
  const categoryCounts: Record<string, number> = {}
  const riskCounts: Record<string, number> = {}
  const criticalityCounts: Record<string, number> = {}

  analyses.forEach(analysis => {
    categoryCounts[analysis.classification.category] = (categoryCounts[analysis.classification.category] || 0) + 1
    riskCounts[analysis.classification.riskLevel] = (riskCounts[analysis.classification.riskLevel] || 0) + 1
    criticalityCounts[analysis.classification.businessCriticality] = (criticalityCounts[analysis.classification.businessCriticality] || 0) + 1
  })

  const highRiskRepos = analyses.filter(a => 
    a.classification.riskLevel === 'Critical' || a.classification.riskLevel === 'High'
  )

  return `# Organization Classification Report

## Executive Summary
- **Total Repositories**: ${analyses.length}
- **Analysis Date**: ${new Date().toISOString()}
- **High-Risk Repositories**: ${highRiskRepos.length}

## Repository Categories
${Object.entries(categoryCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([category, count]) => 
    `- **${category}**: ${count} (${((count / analyses.length) * 100).toFixed(1)}%)`
  ).join('\n')}

## Risk Distribution
${['Critical', 'High', 'Medium', 'Low'].map(level => 
  `- **${level}**: ${riskCounts[level] || 0} (${(((riskCounts[level] || 0) / analyses.length) * 100).toFixed(1)}%)`
).join('\n')}

## Business Criticality
${Object.entries(criticalityCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([criticality, count]) => 
    `- **${criticality}**: ${count} (${((count / analyses.length) * 100).toFixed(1)}%)`
  ).join('\n')}

## High-Risk Repositories
${highRiskRepos.map(analysis => 
  `- **${analysis.repository.full_name}**: ${analysis.classification.riskLevel} (${analysis.riskAssessment.score.toFixed(1)}/100)`
).join('\n')}

## Detailed Repository Analysis
${analyses.map(analysis => `
### ${analysis.repository.full_name}
- **Category**: ${analysis.classification.category}
- **Risk Level**: ${analysis.classification.riskLevel}
- **Business Criticality**: ${analysis.classification.businessCriticality}
- **Risk Score**: ${analysis.riskAssessment.score.toFixed(1)}/100
- **Frameworks**: ${analysis.fileStructure.frameworkIndicators.map((f: any) => f.framework).join(', ') || 'None'}
`).join('\n')}

---
*Report generated on ${new Date().toISOString()}*
`
}

if (require.main === module) {
  main()
}
