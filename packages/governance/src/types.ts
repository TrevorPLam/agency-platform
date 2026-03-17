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

// ============================================================================
// AGENT-SPECIFIC GOVERNANCE TYPES
// ============================================================================

export interface AgentProperties {
  // Agent Classification
  agent_type: 'Autonomous' | 'Semi-Autonomous' | 'Scripted' | 'Orchestrator'
  autonomy_level: 'Low' | 'Medium' | 'High' | 'Critical'
  decision_scope: 'Internal' | 'Customer-Facing' | 'System-Admin' | 'Cross-System'
  
  // Authority & Boundaries
  authority_boundaries: AuthorityBoundary[]
  human_oversight_required: boolean
  escalation_paths: EscalationPath[]
  max_decision_impact: 'Low' | 'Medium' | 'High' | 'Critical'
  
  // Technical Properties
  model_framework: string // e.g., "OpenAI GPT-4", "Claude", "Custom"
  reasoning_approach: 'Symbolic' | 'Neural' | 'Hybrid' | 'Rule-Based'
  memory_systems: MemorySystem[]
  orchestration_pattern: 'Hierarchical' | 'Peer-to-Peer' | 'Event-Driven'
  
  // Operational Properties
  lifecycle_stage: AgentLifecycleStage
  deployment_environment: 'Development' | 'Staging' | 'Production' | 'Hybrid'
  monitoring_level: 'Basic' | 'Enhanced' | 'Comprehensive'
  audit_frequency: 'Real-time' | 'Hourly' | 'Daily' | 'Weekly'
  
  // Compliance & Security
  compliance_frameworks: ComplianceFramework[]
  data_access_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  security_classification: 'Standard' | 'Elevated' | 'High' | 'Critical'
  audit_trail_required: boolean
}

export interface AuthorityBoundary {
  id: string
  name: string
  description: string
  boundary_type: 'Decision' | 'Data' | 'Action' | 'System'
  constraints: string[]
  enforcement: 'Advisory' | 'Warning' | 'Blocking'
  human_review_required: boolean
}

export interface EscalationPath {
  id: string
  trigger_conditions: string[]
  escalation_level: 'Level 1' | 'Level 2' | 'Level 3' | 'Executive'
  responsible_party: string
  timeout_minutes: number
  auto_escalate: boolean
}

export interface MemorySystem {
  type: 'Short-Term' | 'Long-Term' | 'Semantic' | 'Episodic'
  implementation: 'In-Memory' | 'Vector-DB' | 'Graph-DB' | 'Relational'
  retention_policy: string
  privacy_controls: string[]
}

export type AgentLifecycleStage = 
  | 'Development' 
  | 'Testing' 
  | 'Validation' 
  | 'Pilot' 
  | 'Production' 
  | 'Maintenance' 
  | 'Decommissioning'

export interface AgentLifecycle {
  agent_id: string
  current_stage: AgentLifecycleStage
  stage_history: LifecycleStageTransition[]
  approval_requirements: ApprovalRequirement[]
  rollback_procedures: string[]
  performance_metrics: AgentPerformanceMetrics
}

export interface LifecycleStageTransition {
  from_stage: AgentLifecycleStage
  to_stage: AgentLifecycleStage
  timestamp: string
  approved_by: string
  justification: string
  conditions_met: string[]
}

export interface ApprovalRequirement {
  stage: AgentLifecycleStage
  required_approvals: string[]
  approval_criteria: string[]
  automated_checks: string[]
  manual_review: boolean
}

export interface AgentPerformanceMetrics {
  accuracy_rate: number
  task_completion_rate: number
  response_time_ms: number
  error_rate: number
  human_intervention_rate: number
  compliance_score: number
  last_updated: string
}

export interface AgentAuthorization {
  agent_id: string
  permissions: AgentPermission[]
  role_assignments: AgentRole[]
  access_tokens: AgentAccessToken[]
  session_management: AgentSessionManagement
}

export interface AgentPermission {
  id: string
  resource_type: 'API' | 'Database' | 'File' | 'Service' | 'System'
  resource_path: string
  actions: ('read' | 'write' | 'execute' | 'delete' | 'admin')[]
  conditions: string[]
  time_restrictions: TimeRestriction[]
  approval_required: boolean
}

export interface AgentRole {
  role_name: string
  permissions: string[]
  inherited_permissions: string[]
  constraints: string[]
  valid_from: string
  valid_until: string | null
}

export interface AgentAccessToken {
  token_id: string
  issued_at: string
  expires_at: string
  scopes: string[]
  revoked: boolean
  last_used: string | null
}

export interface TimeRestriction {
  type: 'TimeWindow' | 'BusinessHours' | 'MaintenanceWindow'
  start_time: string
  end_time: string
  timezone: string
  days_of_week: number[]
}

export interface AgentSessionManagement {
  session_timeout_minutes: number
  max_concurrent_sessions: number
  session_logging: boolean
  anomaly_detection: boolean
  auto_termination: boolean
}

export interface AgentAuditTrail {
  agent_id: string
  session_id: string
  events: AgentAuditEvent[]
  compliance_status: 'Compliant' | 'Non-Compliant' | 'Under Review'
  last_audit: string
  audit_findings: AuditFinding[]
}

export interface AgentAuditEvent {
  event_id: string
  timestamp: string
  event_type: 'Decision' | 'Action' | 'Data_Access' | 'Error' | 'Escalation'
  description: string
  context: Record<string, any>
  human_reviewed: boolean
  compliance_flags: string[]
  risk_score: number
}

export interface AuditFinding {
  finding_id: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  category: 'Security' | 'Compliance' | 'Performance' | 'Accuracy' | 'Bias'
  description: string
  recommendation: string
  remediation_required: boolean
  remediation_deadline: string | null
  status: 'Open' | 'In Progress' | 'Resolved' | 'Accepted Risk'
}

// Extended risk assessment for agents
export interface AgentRiskAssessment extends RiskAssessment {
  agent_specific_factors: AgentRiskFactor[]
  autonomy_risk_score: number
  human_oversight_risk: number
  decision_impact_risk: number
  bias_fairness_risk: number
  overall_agent_risk: 'Low' | 'Medium' | 'High' | 'Critical'
}

export interface AgentRiskFactor extends RiskFactor {
  factor_category: 'Autonomy' | 'Decision_Impact' | 'Data_Access' | 'Human_Oversight' | 'Technical' | 'Compliance'
  mitigation_strategies: string[]
  monitoring_required: boolean
  review_frequency: 'Continuous' | 'Hourly' | 'Daily' | 'Weekly'
}
