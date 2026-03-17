import { z } from 'zod'
import { RepositoryProperties, ComplianceFramework, PropertyValidation, ValidationError } from './types'

/**
 * Zod schema for repository properties validation
 */
export const repositoryPropertiesSchema = z.object({
  // Business Context
  business_criticality: z.enum(['Low', 'Medium', 'High', 'Critical']),
  owner_team: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Owner team must contain only lowercase letters, numbers, and hyphens'),
  service_tier: z.enum(['Platform', 'Application', 'Library', 'Infrastructure']),
  client_name: z.string().regex(/^[a-z0-9-]+$/, 'Client name must contain only lowercase letters, numbers, and hyphens').optional(),
  public_facing: z.boolean(),

  // Compliance & Security
  compliance_frameworks: z.array(z.enum(['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'CCPA', 'NIST'])).default([]),
  data_classification: z.enum(['Public', 'Internal', 'Confidential', 'Restricted']),
  environment: z.enum(['Development', 'Staging', 'Production', 'Hybrid']),
  security_classification: z.enum(['Standard', 'Elevated', 'High', 'Critical']),

  // Technical Architecture
  tech_stack: z.array(z.string()).optional(),
  architecture_pattern: z.enum(['Monolith', 'Microservices', 'Serverless', 'Library', 'Config']).optional(),
  dependencies: z.enum(['Internal', 'External', 'Mixed']).optional(),
  build_system: z.enum(['Turborepo', 'Webpack', 'Vite', 'Custom']).optional(),

  // Lifecycle & Operations
  lifecycle_stage: z.enum(['Development', 'Maintenance', 'Decommissioning', 'Archived']),
  last_security_review: z.string().datetime().optional(),
  review_frequency: z.enum(['Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'As-needed']).optional(),
  automated_tests: z.boolean(),
  ci_cd_enabled: z.boolean()
})

/**
 * Validates repository properties against schema and business rules
 */
export class PropertyValidator {
  /**
   * Validate complete repository properties
   */
  static validateProperties(properties: unknown): PropertyValidation {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    try {
      // Schema validation
      const result = repositoryPropertiesSchema.safeParse(properties)
      
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push({
            property: issue.path.join('.'),
            message: issue.message,
            severity: 'error',
            code: 'SCHEMA_VALIDATION_ERROR'
          })
        })
      }

      // Business rule validation (only if schema passed)
      if (result.success) {
        const validatedProps = result.data
        const businessRuleErrors = this.validateBusinessRules(validatedProps)
        errors.push(...businessRuleErrors.errors)
        warnings.push(...businessRuleErrors.warnings.map(w => ({
          property: w.property,
          message: w.message,
          severity: 'warning' as const,
          code: 'BUSINESS_RULE_WARNING'
        })))
      }

      // Calculate validation score
      const score = this.calculateValidationScore(errors, warnings)

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        score
      }
    } catch (error) {
      errors.push({
        property: 'validation',
        message: `Unexpected validation error: ${error}`,
        severity: 'error',
        code: 'VALIDATION_EXCEPTION'
      })

      return {
        valid: false,
        errors,
        warnings: warnings.map(w => ({
          property: w.property,
          message: w.message,
          severity: 'warning' as const,
          code: 'VALIDATION_EXCEPTION_WARNING'
        })),
        score: 0
      }
    }
  }

  /**
   * Validate business rules for repository properties
   */
  private static validateBusinessRules(properties: RepositoryProperties): {
    errors: ValidationError[]
    warnings: ValidationError[]
  } {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Rule 1: High business criticality requires elevated security
    if (properties.business_criticality === 'Critical' && 
        properties.security_classification !== 'Critical') {
      errors.push({
        property: 'security_classification',
        message: 'Critical business criticality requires Critical security classification',
        severity: 'error',
        code: 'BUSINESS_CRITICALITY_SECURITY_MISMATCH'
      })
    } else if (properties.business_criticality === 'High' && 
               properties.security_classification === 'Standard') {
      warnings.push({
        property: 'security_classification',
        message: 'High business criticality should have at least Elevated security classification',
        severity: 'warning',
        code: 'BUSINESS_CRITICALITY_SECURITY_RECOMMENDATION'
      })
    }

    // Rule 2: Restricted data requires high security classification
    if (properties.data_classification === 'Restricted' && 
        properties.security_classification !== 'Critical') {
      errors.push({
        property: 'security_classification',
        message: 'Restricted data classification requires Critical security classification',
        severity: 'error',
        code: 'DATA_SECURITY_MISMATCH'
      })
    } else if (properties.data_classification === 'Confidential' && 
               properties.security_classification === 'Standard') {
      warnings.push({
        property: 'security_classification',
        message: 'Confidential data should have at least Elevated security classification',
        severity: 'warning',
        code: 'DATA_SECURITY_RECOMMENDATION'
      })
    }

    // Rule 3: Production environment requires CI/CD
    if (properties.environment === 'Production' && !properties.ci_cd_enabled) {
      errors.push({
        property: 'ci_cd_enabled',
        message: 'Production environment requires CI/CD pipeline to be enabled',
        severity: 'error',
        code: 'PRODUCTION_CICD_REQUIRED'
      })
    }

    // Rule 4: Production environment requires automated tests
    if (properties.environment === 'Production' && !properties.automated_tests) {
      warnings.push({
        property: 'automated_tests',
        message: 'Production environment should have automated tests enabled',
        severity: 'warning',
        code: 'PRODUCTION_TESTS_RECOMMENDED'
      })
    }

    // Rule 5: HIPAA requires dedicated infrastructure
    if (properties.compliance_frameworks.includes('HIPAA') && 
        properties.environment !== 'Production') {
      warnings.push({
        property: 'environment',
        message: 'HIPAA compliance typically requires Production environment with dedicated infrastructure',
        severity: 'warning',
        code: 'HIPAA_ENVIRONMENT_RECOMMENDATION'
      })
    }

    // Rule 6: Public-facing applications need elevated security
    if (properties.public_facing && properties.security_classification === 'Standard') {
      warnings.push({
        property: 'security_classification',
        message: 'Public-facing applications should have at least Elevated security classification',
        severity: 'warning',
        code: 'PUBLIC_FACING_SECURITY_RECOMMENDATION'
      })
    }

    // Rule 7: Critical services should have regular reviews
    if (properties.business_criticality === 'Critical' && 
        (!properties.review_frequency || properties.review_frequency === 'As-needed')) {
      warnings.push({
        property: 'review_frequency',
        message: 'Critical business services should have regular review frequency (Monthly or Quarterly)',
        severity: 'warning',
        code: 'CRITICAL_REVIEW_FREQUENCY_RECOMMENDATION'
      })
    }

    // Rule 8: Client name should be set for Application tier
    if (properties.service_tier === 'Application' && !properties.client_name) {
      warnings.push({
        property: 'client_name',
        message: 'Application tier repositories should specify client name',
        severity: 'warning',
        code: 'APPLICATION_CLIENT_NAME_RECOMMENDATION'
      })
    }

    // Rule 9: Decommissioned repositories should not be in Production
    if (properties.lifecycle_stage === 'Decommissioning' && 
        properties.environment === 'Production') {
      errors.push({
        property: 'lifecycle_stage',
        message: 'Decommissioning repositories should not be in Production environment',
        severity: 'error',
        code: 'DECOMMISSIONING_PRODUCTION_CONFLICT'
      })
    }

    // Rule 10: Platform services should have high availability requirements
    if (properties.service_tier === 'Platform' && 
        properties.business_criticality !== 'Critical') {
      warnings.push({
        property: 'business_criticality',
        message: 'Platform services typically have Critical business criticality',
        severity: 'warning',
        code: 'PLATFORM_CRITICALITY_RECOMMENDATION'
      })
    }

    return { errors, warnings }
  }

  /**
   * Calculate validation score based on errors and warnings
   */
  private static calculateValidationScore(errors: ValidationError[], warnings: ValidationError[]): number {
    let score = 100

    // Deduct points for errors
    score -= errors.length * 20

    // Deduct points for warnings
    score -= warnings.length * 5

    // Ensure score doesn't go below 0
    return Math.max(0, score)
  }

  /**
   * Validate property value for a specific property
   */
  static validatePropertyValue(property: string, value: unknown): {
    valid: boolean
    error?: string
  } {
    try {
      // Create a partial schema with just the specified property
      const partialSchema = z.object({
        [property]: repositoryPropertiesSchema.shape[property as keyof typeof repositoryPropertiesSchema.shape]
      })

      const result = partialSchema.safeParse({ [property]: value })
      
      if (!result.success) {
        return {
          valid: false,
          error: result.error.issues[0]?.message || 'Invalid value'
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error}`
      }
    }
  }

  /**
   * Get property definition and validation rules
   */
  static getPropertyDefinition(property: keyof RepositoryProperties): {
    type: string
    required: boolean
    description: string
    allowedValues?: string[]
    validation?: string
  } {
    const definitions: Record<keyof RepositoryProperties, {
      type: string
      required: boolean
      description: string
      allowedValues?: string[]
      validation?: string
    }> = {
      business_criticality: {
        type: 'enum',
        required: true,
        description: 'Business impact level if repository is compromised or unavailable',
        allowedValues: ['Low', 'Medium', 'High', 'Critical'],
        validation: 'Must be one of: Low, Medium, High, Critical'
      },
      owner_team: {
        type: 'string',
        required: true,
        description: 'Primary team responsible for repository maintenance',
        validation: 'Must contain only lowercase letters, numbers, and hyphens'
      },
      service_tier: {
        type: 'enum',
        required: true,
        description: 'Architectural classification of repository purpose',
        allowedValues: ['Platform', 'Application', 'Library', 'Infrastructure']
      },
      client_name: {
        type: 'string',
        required: false,
        description: 'Associated client for client-specific repositories',
        validation: 'Must contain only lowercase letters, numbers, and hyphens'
      },
      public_facing: {
        type: 'boolean',
        required: true,
        description: 'Whether repository hosts public-facing applications/services'
      },
      compliance_frameworks: {
        type: 'array',
        required: true,
        description: 'Applicable compliance frameworks',
        allowedValues: ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'CCPA', 'NIST']
      },
      data_classification: {
        type: 'enum',
        required: true,
        description: 'Highest data sensitivity level in repository',
        allowedValues: ['Public', 'Internal', 'Confidential', 'Restricted']
      },
      environment: {
        type: 'enum',
        required: true,
        description: 'Primary deployment environment',
        allowedValues: ['Development', 'Staging', 'Production', 'Hybrid']
      },
      security_classification: {
        type: 'enum',
        required: true,
        description: 'Security requirements level',
        allowedValues: ['Standard', 'Elevated', 'High', 'Critical']
      },
      tech_stack: {
        type: 'array',
        required: false,
        description: 'Primary technologies used in repository'
      },
      architecture_pattern: {
        type: 'enum',
        required: false,
        description: 'Architectural pattern of repository',
        allowedValues: ['Monolith', 'Microservices', 'Serverless', 'Library', 'Config']
      },
      dependencies: {
        type: 'enum',
        required: false,
        description: 'Dependency classification',
        allowedValues: ['Internal', 'External', 'Mixed']
      },
      build_system: {
        type: 'enum',
        required: false,
        description: 'Build tooling used',
        allowedValues: ['Turborepo', 'Webpack', 'Vite', 'Custom']
      },
      lifecycle_stage: {
        type: 'enum',
        required: true,
        description: 'Current repository lifecycle stage',
        allowedValues: ['Development', 'Maintenance', 'Decommissioning', 'Archived']
      },
      last_security_review: {
        type: 'datetime',
        required: false,
        description: 'Date of last security review (ISO 8601 format)'
      },
      review_frequency: {
        type: 'enum',
        required: false,
        description: 'Required review cadence',
        allowedValues: ['Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'As-needed']
      },
      automated_tests: {
        type: 'boolean',
        required: true,
        description: 'Whether automated tests are present'
      },
      ci_cd_enabled: {
        type: 'boolean',
        required: true,
        description: 'Whether CI/CD pipeline is configured'
      }
    }

    return definitions[property] || {
      type: 'unknown',
      required: false,
      description: 'Unknown property'
    }
  }

  /**
   * Validate compliance framework combinations
   */
  static validateComplianceFrameworks(frameworks: ComplianceFramework[]): {
    valid: boolean
    warnings: string[]
    recommendations: string[]
  } {
    const warnings: string[] = []
    const recommendations: string[] = []
    let valid = true

    // Check for conflicting frameworks
    if (frameworks.includes('HIPAA') && frameworks.includes('PCI-DSS')) {
      warnings.push('HIPAA and PCI-DSS together require very strict controls and dedicated infrastructure')
    }

    // Check for missing frameworks based on data classification
    if (frameworks.includes('HIPAA') && !frameworks.includes('SOC2')) {
      recommendations.push('Consider adding SOC2 for comprehensive security controls with HIPAA')
    }

    // Check for framework-specific requirements
    if (frameworks.includes('PCI-DSS') && frameworks.length > 1) {
      recommendations.push('PCI-DSS has specific requirements that may conflict with other frameworks')
    }

    // Validate framework names
    const validFrameworks: ComplianceFramework[] = ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'CCPA', 'NIST']
    const invalidFrameworks = frameworks.filter(f => !validFrameworks.includes(f))
    
    if (invalidFrameworks.length > 0) {
      valid = false
      warnings.push(`Invalid compliance frameworks: ${invalidFrameworks.join(', ')}`)
    }

    return { valid, warnings, recommendations }
  }
}
