/**
 * Repository classification types for agency platform governance
 */

export interface RepositoryProperties {
  // Business Context
  business_criticality: 'Low' | 'Medium' | 'High' | 'Critical'
  owner_team: string
  service_tier: 'Platform' | 'Application' | 'Library' | 'Infrastructure'
  client_name?: string
  public_facing: boolean

  // Compliance & Security
  compliance_frameworks: ComplianceFramework[]
  data_classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  environment: 'Development' | 'Staging' | 'Production' | 'Hybrid'
  security_classification: 'Standard' | 'Elevated' | 'High' | 'Critical'

  // Technical Architecture
  tech_stack?: string[]
  architecture_pattern?: 'Monolith' | 'Microservices' | 'Serverless' | 'Library' | 'Config'
  dependencies?: 'Internal' | 'External' | 'Mixed'
  build_system?: 'Turborepo' | 'Webpack' | 'Vite' | 'Custom'

  // Lifecycle & Operations
  lifecycle_stage: 'Development' | 'Maintenance' | 'Decommissioning' | 'Archived'
  last_security_review?: string // ISO 8601 date
  review_frequency?: 'Monthly' | 'Quarterly' | 'Semi-annual' | 'Annual' | 'As-needed'
  automated_tests: boolean
  ci_cd_enabled: boolean
}

export type ComplianceFramework = 
  | 'SOC2'
  | 'ISO27001'
  | 'HIPAA'
  | 'PCI-DSS'
  | 'GDPR'
  | 'CCPA'
  | 'NIST'

export interface RiskAssessment {
  score: number
  category: 'Low' | 'Medium' | 'High' | 'Critical'
  factors: RiskFactor[]
  recommendations: string[]
  last_assessed: string // ISO 8601 date
}

export interface RiskFactor {
  factor: string
  weight: number
  value: number
  contribution: number
}

export interface PropertyValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number
}

export interface ValidationError {
  property: string
  message: string
  severity: 'error' | 'warning'
  code: string
}

export interface ValidationWarning {
  property: string
  message: string
  recommendation: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  owner: {
    login: string
    id: number
  }
  custom_properties?: Record<string, any>
  topics: string[]
  language: string | null
  created_at: string
  updated_at: string
  pushed_at: string
}

export interface PropertyUpdateRequest {
  repository: string // owner/repo
  properties: Partial<RepositoryProperties>
  reason?: string
  requested_by: string
}

export interface PropertyUpdateResult {
  success: boolean
  updated_properties: string[]
  failed_properties: string[]
  errors: string[]
  warnings: string[]
}

export interface ComplianceCheck {
  framework: ComplianceFramework
  compliant: boolean
  violations: ComplianceViolation[]
  recommendations: string[]
  last_checked: string
}

export interface ComplianceViolation {
  control: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  remediation: string
}

export interface GovernancePolicy {
  id: string
  name: string
  description: string
  target: PropertyFilter
  rules: GovernanceRule[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface PropertyFilter {
  business_criticality?: RepositoryProperties['business_criticality'][]
  compliance_frameworks?: ComplianceFramework[]
  data_classification?: RepositoryProperties['data_classification'][]
  environment?: RepositoryProperties['environment'][]
  service_tier?: RepositoryProperties['service_tier'][]
  owner_team?: string[]
  custom_expression?: string
}

export interface GovernanceRule {
  type: 'requirement' | 'restriction' | 'automation'
  name: string
  description: string
  condition: string
  action: string
  enforcement: 'advisory' | 'warning' | 'blocking'
}
