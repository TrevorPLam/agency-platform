#!/usr/bin/env node

/**
 * Command-line tool for managing GitHub repository custom properties
 */

import { PropertyManager } from '@agency/governance'
import { readFileSync } from 'fs'
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
Usage: npm run manage-properties <command> [options]

Commands:
  get <repo>                    Get properties for a repository
  set <repo> <properties-file>  Set properties from JSON file
  list                          List all repositories with properties
  search <filters-file>         Search repositories by property filters
  template <repo> <template>     Apply predefined template
  remove <repo> <property>      Remove a property
  bulk <updates-file>           Bulk update multiple repositories

Templates:
  platform                      Platform service template
  application                   Client application template
  library                       Shared library template
  infrastructure                Infrastructure tool template

Examples:
  npm run manage-properties get agency-platform
  npm run manage-properties set client-app ./properties.json
  npm run manage-properties list
  npm run manage-properties template client-app application
  npm run manage-properties bulk ./bulk-updates.json
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const manager = new PropertyManager(config.token, config.organization)

  try {
    switch (command) {
      case 'get':
        await handleGet(manager, args[1])
        break
      case 'set':
        await handleSet(manager, args[1], args[2])
        break
      case 'list':
        await handleList(manager)
        break
      case 'search':
        await handleSearch(manager, args[1])
        break
      case 'template':
        await handleTemplate(manager, args[1], args[2])
        break
      case 'remove':
        await handleRemove(manager, args[1], args[2])
        break
      case 'bulk':
        await handleBulk(manager, args[1])
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

async function handleGet(manager: PropertyManager, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  const properties = await manager.getRepositoryProperties(repo)
  console.log(`Properties for ${repo}:`)
  console.log(JSON.stringify(properties, null, 2))
}

async function handleSet(manager: PropertyManager, repo: string, propertiesFile: string) {
  if (!repo || !propertiesFile) {
    console.error('Repository name and properties file are required')
    process.exit(1)
  }

  try {
    const propertiesData = readFileSync(resolve(propertiesFile), 'utf-8')
    const properties = JSON.parse(propertiesData)
    
    const result = await manager.setRepositoryProperties(repo, properties)
    
    console.log(`Update result for ${repo}:`)
    console.log(`Success: ${result.success}`)
    console.log(`Updated: ${result.updated_properties.join(', ')}`)
    
    if (result.failed_properties.length > 0) {
      console.log(`Failed: ${result.failed_properties.join(', ')}`)
      console.log('Errors:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (result.warnings.length > 0) {
      console.log('Warnings:')
      result.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
  } catch (error) {
    console.error('Failed to read properties file:', error)
    process.exit(1)
  }
}

async function handleList(manager: PropertyManager) {
  const repositories = await manager.getAllRepositoriesWithProperties()
  
  console.log(`Found ${repositories.length} repositories:`)
  console.log()
  
  repositories.forEach(repo => {
    console.log(`${repo.full_name}:`)
    console.log(`  Private: ${repo.private}`)
    console.log(`  Language: ${repo.language || 'N/A'}`)
    console.log(`  Topics: ${repo.topics.join(', ') || 'None'}`)
    
    if (repo.custom_properties && Object.keys(repo.custom_properties).length > 0) {
      console.log('  Properties:')
      Object.entries(repo.custom_properties).forEach(([key, value]) => {
        console.log(`    ${key}: ${JSON.stringify(value)}`)
      })
    } else {
      console.log('  Properties: None')
    }
    console.log()
  })
}

async function handleSearch(manager: PropertyManager, filtersFile: string) {
  if (!filtersFile) {
    console.error('Filters file is required')
    process.exit(1)
  }

  try {
    const filtersData = readFileSync(resolve(filtersFile), 'utf-8')
    const filters = JSON.parse(filtersData)
    
    const repositories = await manager.searchRepositoriesByProperties(filters)
    
    console.log(`Found ${repositories.length} repositories matching filters:`)
    console.log()
    
    repositories.forEach(repo => {
      console.log(`${repo.full_name}`)
      if (repo.description) {
        console.log(`  Description: ${repo.description}`)
      }
      console.log()
    })
  } catch (error) {
    console.error('Failed to read filters file:', error)
    process.exit(1)
  }
}

async function handleTemplate(manager: PropertyManager, repo: string, templateName: string) {
  if (!repo || !templateName) {
    console.error('Repository name and template name are required')
    process.exit(1)
  }

  const templates: Record<string, any> = {
    platform: {
      business_criticality: 'Critical',
      owner_team: 'platform-ops',
      service_tier: 'Platform',
      public_facing: false,
      compliance_frameworks: ['SOC2', 'ISO27001'],
      data_classification: 'Internal',
      environment: 'Production',
      security_classification: 'High',
      lifecycle_stage: 'Maintenance',
      automated_tests: true,
      ci_cd_enabled: true,
      tech_stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
      architecture_pattern: 'Microservices',
      build_system: 'Turborepo',
      review_frequency: 'Quarterly'
    },
    application: {
      business_criticality: 'High',
      owner_team: 'client-services',
      service_tier: 'Application',
      public_facing: true,
      compliance_frameworks: ['SOC2', 'ISO27001'],
      data_classification: 'Confidential',
      environment: 'Production',
      security_classification: 'Elevated',
      lifecycle_stage: 'Development',
      automated_tests: true,
      ci_cd_enabled: true,
      tech_stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      architecture_pattern: 'Monolith',
      build_system: 'Turborepo',
      review_frequency: 'Monthly'
    },
    library: {
      business_criticality: 'Medium',
      owner_team: 'platform-ops',
      service_tier: 'Library',
      public_facing: false,
      compliance_frameworks: ['SOC2'],
      data_classification: 'Internal',
      environment: 'Hybrid',
      security_classification: 'Standard',
      lifecycle_stage: 'Maintenance',
      automated_tests: true,
      ci_cd_enabled: true,
      build_system: 'Turborepo',
      review_frequency: 'Quarterly'
    },
    infrastructure: {
      business_criticality: 'Low',
      owner_team: 'platform-ops',
      service_tier: 'Infrastructure',
      public_facing: false,
      compliance_frameworks: [],
      data_classification: 'Internal',
      environment: 'Development',
      security_classification: 'Standard',
      lifecycle_stage: 'Development',
      automated_tests: false,
      ci_cd_enabled: true,
      review_frequency: 'Semi-annual'
    }
  }

  const template = templates[templateName]
  if (!template) {
    console.error(`Unknown template: ${templateName}`)
    console.log(`Available templates: ${Object.keys(templates).join(', ')}`)
    process.exit(1)
  }

  const result = await manager.applyPropertyTemplate(repo, template)
  
  console.log(`Template application result for ${repo}:`)
  console.log(`Success: ${result.success}`)
  console.log(`Updated: ${result.updated_properties.join(', ')}`)
  
  if (result.failed_properties.length > 0) {
    console.log(`Failed: ${result.failed_properties.join(', ')}`)
    console.log('Errors:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }
}

async function handleRemove(manager: PropertyManager, repo: string, propertyName: string) {
  if (!repo || !propertyName) {
    console.error('Repository name and property name are required')
    process.exit(1)
  }

  const success = await manager.removeProperty(repo, propertyName)
  
  if (success) {
    console.log(`Successfully removed property ${propertyName} from ${repo}`)
  } else {
    console.log(`Failed to remove property ${propertyName} from ${repo}`)
  }
}

async function handleBulk(manager: PropertyManager, updatesFile: string) {
  if (!updatesFile) {
    console.error('Updates file is required')
    process.exit(1)
  }

  try {
    const updatesData = readFileSync(resolve(updatesFile), 'utf-8')
    const updates = JSON.parse(updatesData)
    
    const results = await manager.bulkUpdateProperties(updates)
    
    console.log(`Bulk update results:`)
    console.log()
    
    results.forEach((result, index) => {
      const update = updates[index]
      console.log(`${update.repository}:`)
      console.log(`  Success: ${result.success}`)
      console.log(`  Updated: ${result.updated_properties.join(', ')}`)
      
      if (result.failed_properties.length > 0) {
        console.log(`  Failed: ${result.failed_properties.join(', ')}`)
      }
      
      if (result.errors.length > 0) {
        console.log('  Errors:')
        result.errors.forEach(error => console.log(`    - ${error}`))
      }
      console.log()
    })
  } catch (error) {
    console.error('Failed to read updates file:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
