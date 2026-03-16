import { Octokit } from '@octokit/rest'
import { 
  RepositoryProperties, 
  GitHubRepository, 
  PropertyUpdateRequest, 
  PropertyUpdateResult,
  ValidationError 
} from './types'

/**
 * Manages GitHub repository custom properties for governance
 */
export class PropertyManager {
  private octokit: Octokit
  private organization: string

  constructor(token: string, organization: string) {
    this.octokit = new Octokit({ auth: token })
    this.organization = organization
  }

  /**
   * Get all custom properties for a repository
   */
  async getRepositoryProperties(repo: string): Promise<Partial<RepositoryProperties>> {
    try {
      const { data } = await this.octokit.rest.repos.getAllCustomPropertyValues({
        owner: this.organization,
        repo,
      })

      // Convert GitHub custom properties to our schema
      const properties: Partial<RepositoryProperties> = {}
      
      for (const prop of data) {
        const propertyName = prop.property_name
        const value = prop.value

        switch (propertyName) {
          case 'business_criticality':
            properties.business_criticality = value as any
            break
          case 'owner_team':
            properties.owner_team = value
            break
          case 'service_tier':
            properties.service_tier = value as any
            break
          case 'client_name':
            properties.client_name = value
            break
          case 'public_facing':
            properties.public_facing = value === 'true'
            break
          case 'compliance_frameworks':
            properties.compliance_frameworks = Array.isArray(value) ? value : []
            break
          case 'data_classification':
            properties.data_classification = value as any
            break
          case 'environment':
            properties.environment = value as any
            break
          case 'security_classification':
            properties.security_classification = value as any
            break
          case 'tech_stack':
            properties.tech_stack = Array.isArray(value) ? value : []
            break
          case 'architecture_pattern':
            properties.architecture_pattern = value as any
            break
          case 'dependencies':
            properties.dependencies = value as any
            break
          case 'build_system':
            properties.build_system = value as any
            break
          case 'lifecycle_stage':
            properties.lifecycle_stage = value as any
            break
          case 'last_security_review':
            properties.last_security_review = value
            break
          case 'review_frequency':
            properties.review_frequency = value as any
            break
          case 'automated_tests':
            properties.automated_tests = value === 'true'
            break
          case 'ci_cd_enabled':
            properties.ci_cd_enabled = value === 'true'
            break
        }
      }

      return properties
    } catch (error) {
      throw new Error(`Failed to get properties for ${repo}: ${error}`)
    }
  }

  /**
   * Set or update custom properties for a repository
   */
  async setRepositoryProperties(
    repo: string, 
    properties: Partial<RepositoryProperties>
  ): Promise<PropertyUpdateResult> {
    const result: PropertyUpdateResult = {
      success: true,
      updated_properties: [],
      failed_properties: [],
      errors: [],
      warnings: []
    }

    try {
      // Convert our schema to GitHub custom properties format
      const githubProperties: Record<string, string | string[] | null> = {}

      for (const [key, value] of Object.entries(properties)) {
        if (value === undefined) continue

        switch (key) {
          case 'business_criticality':
          case 'owner_team':
          case 'service_tier':
          case 'client_name':
          case 'data_classification':
          case 'environment':
          case 'security_classification':
          case 'architecture_pattern':
          case 'dependencies':
          case 'build_system':
          case 'lifecycle_stage':
          case 'last_security_review':
          case 'review_frequency':
            githubProperties[key] = value as string
            break

          case 'public_facing':
          case 'automated_tests':
          case 'ci_cd_enabled':
            githubProperties[key] = value ? 'true' : 'false'
            break

          case 'compliance_frameworks':
          case 'tech_stack':
            githubProperties[key] = Array.isArray(value) ? value : []
            break

          default:
            result.warnings.push(`Unknown property: ${key}`)
            continue
        }
      }

      // Set properties via GitHub API
      for (const [propertyName, value] of Object.entries(githubProperties)) {
        try {
          await this.octokit.rest.repos.createOrUpdateCustomPropertiesValues({
            owner: this.organization,
            repo,
            custom_properties: {
              [propertyName]: value
            }
          })
          result.updated_properties.push(propertyName)
        } catch (error) {
          result.failed_properties.push(propertyName)
          result.errors.push(`Failed to set ${propertyName}: ${error}`)
          result.success = false
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Unexpected error: ${error}`)
    }

    return result
  }

  /**
   * Get all repositories in the organization with their properties
   */
  async getAllRepositoriesWithProperties(): Promise<GitHubRepository[]> {
    try {
      const repositories: GitHubRepository[] = []
      
      // Get all repositories in the organization
      const repos = await this.octokit.paginate(
        this.octokit.rest.repos.listForOrg,
        {
          org: this.organization,
          type: 'all',
          per_page: 100
        }
      )

      // Get properties for each repository
      for (const repo of repos) {
        try {
          const properties = await this.getRepositoryProperties(repo.name)
          
          repositories.push({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            owner: {
              login: repo.owner.login,
              id: repo.owner.id
            },
            custom_properties: properties as Record<string, any>,
            topics: repo.topics || [],
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at
          })
        } catch (error) {
          console.warn(`Failed to get properties for ${repo.name}:`, error)
          // Still include repository without properties
          repositories.push({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            owner: {
              login: repo.owner.login,
              id: repo.owner.id
            },
            topics: repo.topics || [],
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at
          })
        }
      }

      return repositories
    } catch (error) {
      throw new Error(`Failed to get repositories: ${error}`)
    }
  }

  /**
   * Apply property template to a repository
   */
  async applyPropertyTemplate(
    repo: string, 
    template: RepositoryProperties
  ): Promise<PropertyUpdateResult> {
    return this.setRepositoryProperties(repo, template)
  }

  /**
   * Remove a custom property from a repository
   */
  async removeProperty(repo: string, propertyName: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.createOrUpdateCustomPropertiesValues({
        owner: this.organization,
        repo,
        custom_properties: {
          [propertyName]: null // Setting to null removes the property
        }
      })
      return true
    } catch (error) {
      console.error(`Failed to remove property ${propertyName} from ${repo}:`, error)
      return false
    }
  }

  /**
   * Bulk update properties for multiple repositories
   */
  async bulkUpdateProperties(
    updates: PropertyUpdateRequest[]
  ): Promise<PropertyUpdateResult[]> {
    const results: PropertyUpdateResult[] = []

    for (const update of updates) {
      const [owner, repo] = update.repository.split('/')
      
      if (owner !== this.organization) {
        results.push({
          success: false,
          updated_properties: [],
          failed_properties: Object.keys(update.properties),
          errors: [`Repository ${update.repository} not in organization ${this.organization}`],
          warnings: []
        })
        continue
      }

      const result = await this.setRepositoryProperties(repo, update.properties)
      results.push(result)
    }

    return results
  }

  /**
   * Search repositories by property values
   */
  async searchRepositoriesByProperties(
    filters: Partial<RepositoryProperties>
  ): Promise<GitHubRepository[]> {
    const allRepos = await this.getAllRepositoriesWithProperties()
    
    return allRepos.filter(repo => {
      if (!repo.custom_properties) return false

      return Object.entries(filters).every(([key, filterValue]) => {
        const repoValue = repo.custom_properties![key]
        
        if (filterValue === undefined) return true
        if (repoValue === undefined) return false

        // Handle array properties
        if (Array.isArray(filterValue) && Array.isArray(repoValue)) {
          return filterValue.some(val => repoValue.includes(val))
        }

        // Handle exact matches
        return repoValue === filterValue
      })
    })
  }
}
