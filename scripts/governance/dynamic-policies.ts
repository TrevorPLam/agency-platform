#!/usr/bin/env node

/**
 * Dynamic policy targeting system for repository governance
 */

import { PropertyManager } from '@agency/governance'
import { 
  GovernancePolicy, 
  PropertyFilter, 
  GovernanceRule,
  RepositoryProperties 
} from '@agency/governance/types'
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

/**
 * Manages dynamic policy targeting based on repository properties
 */
export class PolicyManager {
  private propertyManager: PropertyManager
  private organization: string

  constructor(token: string, organization: string) {
    this.propertyManager = new PropertyManager(token, organization)
    this.organization = organization
  }

  /**
   * Create a new governance policy
   */
  createPolicy(
    name: string,
    description: string,
    target: PropertyFilter,
    rules: GovernanceRule[]
  ): GovernancePolicy {
    return {
      id: `policy-${Date.now()}`,
      name,
      description,
      target,
      rules,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Evaluate if a repository matches the policy target filter
   */
  async evaluatePolicyTarget(
    policy: GovernancePolicy, 
    repository: string
  ): Promise<boolean> {
    const properties = await this.propertyManager.getRepositoryProperties(repository)
    
    return this.matchesFilter(properties, policy.target)
  }

  /**
   * Check if repository properties match a filter
   */
  private matchesFilter(
    properties: Partial<RepositoryProperties>, 
    filter: PropertyFilter
  ): boolean {
    // Check business criticality
    if (filter.business_criticality && properties.business_criticality) {
      if (!filter.business_criticality.includes(properties.business_criticality)) {
        return false
      }
    }

    // Check compliance frameworks
    if (filter.compliance_frameworks && properties.compliance_frameworks) {
      const hasRequiredFramework = filter.compliance_frameworks.some(framework =>
        properties.compliance_frameworks!.includes(framework)
      )
      if (!hasRequiredFramework) {
        return false
      }
    }

    // Check data classification
    if (filter.data_classification && properties.data_classification) {
      if (!filter.data_classification.includes(properties.data_classification)) {
        return false
      }
    }

    // Check environment
    if (filter.environment && properties.environment) {
      if (!filter.environment.includes(properties.environment)) {
        return false
      }
    }

    // Check service tier
    if (filter.service_tier && properties.service_tier) {
      if (!filter.service_tier.includes(properties.service_tier)) {
        return false
      }
    }

    // Check owner team
    if (filter.owner_team && properties.owner_team) {
      if (!filter.owner_team.includes(properties.owner_team)) {
        return false
      }
    }

    // Custom expression evaluation (basic implementation)
    if (filter.custom_expression) {
      return this.evaluateCustomExpression(properties, filter.custom_expression)
    }

    return true
  }

  /**
   * Evaluate custom expression (simplified implementation)
   */
  private evaluateCustomExpression(
    properties: Partial<RepositoryProperties>, 
    expression: string
  ): boolean {
    try {
      // Basic expression evaluation - in production, use a proper expression parser
      const context = {
        ...properties,
        // Add helper functions
        hasFramework: (framework: string) => 
          properties.compliance_frameworks?.includes(framework as any) || false,
        isProduction: () => properties.environment === 'Production',
        isPublic: () => properties.public_facing === true,
        isCritical: () => properties.business_criticality === 'Critical'
      }

      // Simple string replacement for basic expressions
      let evalExpression = expression
      
      // Replace property references
      Object.keys(context).forEach(key => {
        const value = (context as any)[key]
        if (typeof value === 'string') {
          evalExpression = evalExpression.replace(
            new RegExp(`\\b${key}\\b`, 'g'), 
            `"${value}"`
          )
        } else if (typeof value === 'boolean') {
          evalExpression = evalExpression.replace(
            new RegExp(`\\b${key}\\b`, 'g'), 
            value.toString()
          )
        }
      })

      // Replace function calls with their results
      evalExpression = evalExpression.replace(
        /hasFramework\(['"]([^'"]+)['"]\)/g,
        (match, framework) => context.hasFramework(framework).toString()
      )
      
      evalExpression = evalExpression.replace(
        /isProduction\(\)/g,
        context.isProduction().toString()
      )
      
      evalExpression = evalExpression.replace(
        /isPublic\(\)/g,
        context.isPublic().toString()
      )
      
      evalExpression = evalExpression.replace(
        /isCritical\(\)/g,
        context.isCritical().toString()
      )

      // Evaluate the expression
      return eval(evalExpression)
    } catch (error) {
      console.warn(`Failed to evaluate expression: ${expression}`, error)
      return false
    }
  }

  /**
   * Find all repositories that match a policy target
   */
  async findMatchingRepositories(policy: GovernancePolicy): Promise<string[]> {
    const allRepos = await this.propertyManager.getAllRepositoriesWithProperties()
    const matchingRepos: string[] = []

    for (const repo of allRepos) {
      if (await this.evaluatePolicyTarget(policy, repo.name)) {
        matchingRepos.push(repo.name)
      }
    }

    return matchingRepos
  }

  /**
   * Generate GitHub ruleset configuration from policy
   */
  generateRulesetConfig(policy: GovernancePolicy): any {
    const ruleset = {
      name: policy.name,
      target: {
        repository_filters: this.buildRepositoryFilters(policy.target)
      },
      rules: policy.rules.map(rule => this.buildGitHubRule(rule))
    }

    return ruleset
  }

  /**
   * Build repository filters for GitHub ruleset
   */
  private buildRepositoryFilters(filter: PropertyFilter): any[] {
    const filters: any[] = []

    if (filter.business_criticality) {
      filters.push({
        type: 'property',
        property_name: 'business_criticality',
        pattern: filter.business_criticality.join(',')
      })
    }

    if (filter.compliance_frameworks) {
      filters.push({
        type: 'property',
        property_name: 'compliance_frameworks',
        pattern: filter.compliance_frameworks.join(',')
      })
    }

    if (filter.data_classification) {
      filters.push({
        type: 'property',
        property_name: 'data_classification',
        pattern: filter.data_classification.join(',')
      })
    }

    if (filter.environment) {
      filters.push({
        type: 'property',
        property_name: 'environment',
        pattern: filter.environment.join(',')
      })
    }

    if (filter.service_tier) {
      filters.push({
        type: 'property',
        property_name: 'service_tier',
        pattern: filter.service_tier.join(',')
      })
    }

    if (filter.owner_team) {
      filters.push({
        type: 'property',
        property_name: 'owner_team',
        pattern: filter.owner_team.join(',')
      })
    }

    return filters
  }

  /**
   * Build GitHub rule from governance rule
   */
  private buildGitHubRule(rule: GovernanceRule): any {
    switch (rule.type) {
      case 'requirement':
        return this.buildRequirementRule(rule)
      case 'restriction':
        return this.buildRestrictionRule(rule)
      case 'automation':
        return this.buildAutomationRule(rule)
      default:
        throw new Error(`Unknown rule type: ${rule.type}`)
    }
  }

  /**
   * Build requirement rule
   */
  private buildRequirementRule(rule: GovernanceRule): any {
    const ruleConfig: any = {
      type: 'creation'
    }

    // Parse rule condition to determine requirements
    if (rule.condition.includes('approvals')) {
      ruleConfig.requires_approving_reviews = true
      const match = rule.condition.match(/(\d+)/)
      if (match) {
        ruleConfig.required_approving_review_count = parseInt(match[1])
      }
    }

    if (rule.condition.includes('code_scanning')) {
      ruleConfig.requires_code_scanning = true
    }

    if (rule.condition.includes('status_checks')) {
      ruleConfig.requires_status_checks = true
      // Extract status check names from condition
      const statusChecks = rule.condition.match(/status_checks:\s*\[([^\]]+)\]/)
      if (statusChecks) {
        const checks = statusChecks[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
        ruleConfig.required_status_checks = {
          strict: true,
          contexts: checks
        }
      }
    }

    return ruleConfig
  }

  /**
   * Build restriction rule
   */
  private buildRestrictionRule(rule: GovernanceRule): any {
    const ruleConfig: any = {
      type: 'push'
    }

    if (rule.condition.includes('signed_commits')) {
      ruleConfig.requires_signed_commits = true
    }

    if (rule.condition.includes('file_paths')) {
      const paths = rule.condition.match(/file_paths:\s*\[([^\]]+)\]/)
      if (paths) {
        const forbiddenPaths = paths[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
        ruleConfig.block_file_paths = forbiddenPaths
      }
    }

    if (rule.condition.includes('file_size')) {
      const match = rule.condition.match(/file_size:\s*(\d+)/)
      if (match) {
        ruleConfig.max_file_size = parseInt(match[1])
      }
    }

    return ruleConfig
  }

  /**
   * Build automation rule
   */
  private buildAutomationRule(rule: GovernanceRule): any {
    // Automation rules are implemented as GitHub Actions workflows
    // This returns metadata for workflow generation
    return {
      type: 'automation',
      trigger: rule.condition,
      action: rule.action,
      enforcement: rule.enforcement
    }
  }

  /**
   * Apply policy to matching repositories
   */
  async applyPolicy(policy: GovernancePolicy): Promise<{
    applied: string[]
    failed: string[]
    errors: string[]
  }> {
    const matchingRepos = await this.findMatchingRepositories(policy)
    const result = {
      applied: [] as string[],
      failed: [] as string[],
      errors: [] as string[]
    }

    for (const repo of matchingRepos) {
      try {
        // Apply policy rules to repository
        await this.applyPolicyToRepository(policy, repo)
        result.applied.push(repo)
      } catch (error) {
        result.failed.push(repo)
        result.errors.push(`${repo}: ${error}`)
      }
    }

    return result
  }

  /**
   * Apply policy rules to a specific repository
   */
  private async applyPolicyToRepository(
    policy: GovernancePolicy, 
    repository: string
  ): Promise<void> {
    // This would integrate with GitHub API to apply rulesets
    // For now, we'll generate the configuration and save it
    const ruleset = this.generateRulesetConfig(policy)
    
    const outputPath = resolve(__dirname, '../generated-rulesets')
    const fileName = `${repository}-${policy.id}.json`
    
    // In production, this would call GitHub API to create/update rulesets
    console.log(`Generated ruleset for ${repository}:`, ruleset)
    
    // Write to file for demonstration
    try {
      writeFileSync(resolve(outputPath, fileName), JSON.stringify(ruleset, null, 2))
    } catch (error) {
      console.warn(`Failed to write ruleset file: ${error}`)
    }
  }

  /**
   * Generate predefined policies
   */
  generatePredefinedPolicies(): GovernancePolicy[] {
    return [
      // High-risk repository policy
      this.createPolicy(
        'High-Risk Repository Security',
        'Enhanced security controls for critical repositories',
        {
          business_criticality: ['Critical'],
          data_classification: ['Restricted'],
          custom_expression: 'business_criticality === "Critical" || data_classification === "Restricted"'
        },
        [
          {
            type: 'requirement',
            name: 'Enhanced Approvals',
            description: 'Require 2 approvals for critical changes',
            condition: 'approvals: 2',
            action: 'enforce_approvals',
            enforcement: 'blocking'
          },
          {
            type: 'requirement',
            name: 'Code Scanning Required',
            description: 'Require code scanning to pass',
            condition: 'code_scanning: true',
            action: 'run_code_scanning',
            enforcement: 'blocking'
          },
          {
            type: 'requirement',
            name: 'Status Checks',
            description: 'Require security and license checks',
            condition: 'status_checks: ["security-scan", "license-check"]',
            action: 'require_status_checks',
            enforcement: 'blocking'
          }
        ]
      ),

      // Compliance framework policy
      this.createPolicy(
        'HIPAA Compliance Requirements',
        'HIPAA-specific controls for healthcare repositories',
        {
          compliance_frameworks: ['HIPAA'],
          custom_expression: 'hasFramework("HIPAA")'
        },
        [
          {
            type: 'restriction',
            name: 'Signed Commits Required',
            description: 'All commits must be signed',
            condition: 'signed_commits: true',
            action: 'enforce_signed_commits',
            enforcement: 'blocking'
          },
          {
            type: 'restriction',
            name: 'Restricted File Paths',
            description: 'Block sensitive file extensions',
            condition: 'file_paths: ["*.key", "*.pem", "*.p12"]',
            action: 'block_file_paths',
            enforcement: 'blocking'
          },
          {
            type: 'automation',
            name: 'HIPAA Audit Trail',
            description: 'Generate HIPAA compliance audit logs',
            condition: 'hasFramework("HIPAA")',
            action: 'generate_hipaa_audit',
            enforcement: 'advisory'
          }
        ]
      ),

      // Public-facing application policy
      this.createPolicy(
        'Public-Facing Application Security',
        'Security requirements for public applications',
        {
          public_facing: [true],
          environment: ['Production'],
          custom_expression: 'isPublic() && isProduction()'
        },
        [
          {
            type: 'requirement',
            name: 'Security Review Required',
            description: 'Require security review for deployments',
            condition: 'approvals: 1',
            action: 'require_security_review',
            enforcement: 'blocking'
          },
          {
            type: 'requirement',
            name: 'Dependency Scanning',
            description: 'Scan for vulnerable dependencies',
            condition: 'dependency_scan: true',
            action: 'run_dependency_scan',
            enforcement: 'blocking'
          },
          {
            type: 'automation',
            name: 'Security Monitoring',
            description: 'Enable security monitoring',
            condition: 'isPublic()',
            action: 'enable_security_monitoring',
            enforcement: 'advisory'
          }
        ]
      )
    ]
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: npm run dynamic-policies <command> [options]

Commands:
  create <name> <description> <filters-file> <rules-file>  Create a new policy
  evaluate <policy-file> <repo>                              Evaluate policy target
  apply <policy-file>                                       Apply policy to repos
  generate-predefined                                        Generate predefined policies
  ruleset <policy-file>                                      Generate GitHub ruleset config

Examples:
  npm run dynamic-policies create "High Security" "Enhanced security" ./filters.json ./rules.json
  npm run dynamic-policies evaluate ./policy.json agency-platform
  npm run dynamic-policies apply ./policy.json
  npm run dynamic-policies generate-predefined
  npm run dynamic-policies ruleset ./policy.json
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const policyManager = new PolicyManager(config.token, config.organization)

  try {
    switch (command) {
      case 'create':
        await handleCreate(policyManager, args[1], args[2], args[3], args[4])
        break
      case 'evaluate':
        await handleEvaluate(policyManager, args[1], args[2])
        break
      case 'apply':
        await handleApply(policyManager, args[1])
        break
      case 'generate-predefined':
        await handleGeneratePredefined(policyManager)
        break
      case 'ruleset':
        await handleRuleset(policyManager, args[1])
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

async function handleCreate(
  policyManager: PolicyManager, 
  name: string, 
  description: string, 
  filtersFile: string, 
  rulesFile: string
) {
  if (!name || !description || !filtersFile || !rulesFile) {
    console.error('All arguments are required: name, description, filters-file, rules-file')
    process.exit(1)
  }

  try {
    const filtersData = readFileSync(resolve(filtersFile), 'utf-8')
    const rulesData = readFileSync(resolve(rulesFile), 'utf-8')
    
    const filters = JSON.parse(filtersData)
    const rules = JSON.parse(rulesData)
    
    const policy = policyManager.createPolicy(name, description, filters, rules)
    
    const outputPath = resolve(__dirname, '../policies')
    const fileName = `${policy.name.toLowerCase().replace(/\s+/g, '-')}.json`
    
    writeFileSync(resolve(outputPath, fileName), JSON.stringify(policy, null, 2))
    
    console.log(`Policy created: ${policy.id}`)
    console.log(`Saved to: ${outputPath}/${fileName}`)
  } catch (error) {
    console.error('Failed to create policy:', error)
    process.exit(1)
  }
}

async function handleEvaluate(policyManager: PolicyManager, policyFile: string, repo: string) {
  if (!policyFile || !repo) {
    console.error('Policy file and repository name are required')
    process.exit(1)
  }

  try {
    const policyData = readFileSync(resolve(policyFile), 'utf-8')
    const policy = JSON.parse(policyData)
    
    const matches = await policyManager.evaluatePolicyTarget(policy, repo)
    
    console.log(`Repository ${repo} ${matches ? 'matches' : 'does not match'} policy target`)
  } catch (error) {
    console.error('Failed to evaluate policy:', error)
    process.exit(1)
  }
}

async function handleApply(policyManager: PolicyManager, policyFile: string) {
  if (!policyFile) {
    console.error('Policy file is required')
    process.exit(1)
  }

  try {
    const policyData = readFileSync(resolve(policyFile), 'utf-8')
    const policy = JSON.parse(policyData)
    
    const result = await policyManager.applyPolicy(policy)
    
    console.log('Policy application results:')
    console.log(`Applied to: ${result.applied.join(', ')}`)
    
    if (result.failed.length > 0) {
      console.log(`Failed: ${result.failed.join(', ')}`)
      console.log('Errors:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
  } catch (error) {
    console.error('Failed to apply policy:', error)
    process.exit(1)
  }
}

async function handleGeneratePredefined(policyManager: PolicyManager) {
  const policies = policyManager.generatePredefinedPolicies()
  const outputPath = resolve(__dirname, '../policies')

  policies.forEach(policy => {
    const fileName = `${policy.name.toLowerCase().replace(/\s+/g, '-')}.json`
    writeFileSync(resolve(outputPath, fileName), JSON.stringify(policy, null, 2))
    console.log(`Generated: ${fileName}`)
  })
}

async function handleRuleset(policyManager: PolicyManager, policyFile: string) {
  if (!policyFile) {
    console.error('Policy file is required')
    process.exit(1)
  }

  try {
    const policyData = readFileSync(resolve(policyFile), 'utf-8')
    const policy = JSON.parse(policyData)
    
    const ruleset = policyManager.generateRulesetConfig(policy)
    
    console.log('Generated GitHub ruleset configuration:')
    console.log(JSON.stringify(ruleset, null, 2))
  } catch (error) {
    console.error('Failed to generate ruleset:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
