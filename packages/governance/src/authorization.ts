/**
 * Agent Authorization System
 * 
 * Extends the existing governance framework with agent-specific authorization
 * capabilities, including bounded autonomy, escalation paths, and authority boundaries.
 */

import {
  AgentAuthorization,
  AgentPermission,
  AgentRole,
  AgentAccessToken,
  AuthorityBoundary,
  EscalationPath,
  AgentProperties,
  ComplianceFramework,
  AgentAuditEvent
} from './types'

export interface AuthorizationOptions {
  agentProperties: AgentProperties
  existingPermissions?: string[]
  complianceFrameworks: ComplianceFramework[]
}

export class AgentAuthorizationManager {
  private agentProperties: AgentProperties
  private complianceFrameworks: ComplianceFramework[]
  private permissions: Map<string, AgentPermission> = new Map()
  private roles: Map<string, AgentRole> = new Map()
  private accessTokens: Map<string, AgentAccessToken> = new Map()

  constructor(options: AuthorizationOptions) {
    this.agentProperties = options.agentProperties
    this.complianceFrameworks = options.complianceFrameworks
    this.initializeDefaultPermissions()
    this.initializeDefaultRoles()
  }

  /**
   * Initialize default permissions based on agent properties
   */
  private initializeDefaultPermissions(): void {
    const basePermissions = this.generateBasePermissions()
    basePermissions.forEach(permission => {
      this.permissions.set(permission.id, permission)
    })
  }

  /**
   * Initialize default roles based on agent type and autonomy level
   */
  private initializeDefaultRoles(): void {
    const baseRoles = this.generateBaseRoles()
    baseRoles.forEach(role => {
      this.roles.set(role.role_name, role)
    })
  }

  /**
   * Generate base permissions based on agent properties
   */
  private generateBasePermissions(): AgentPermission[] {
    const permissions: AgentPermission[] = []
    const { agent_type, autonomy_level, decision_scope, data_access_level } = this.agentProperties

    // Read permissions based on data access level
    if (data_access_level !== 'Public') {
      permissions.push({
        id: 'read_internal_data',
        resource_type: 'Database',
        resource_path: '/internal/*',
        actions: ['read'],
        conditions: [`data_classification <= ${data_access_level}`],
        time_restrictions: [],
        approval_required: autonomy_level === 'Critical'
      })
    }

    // Decision-making permissions based on autonomy level
    if (autonomy_level !== 'Low') {
      permissions.push({
        id: 'make_decisions',
        resource_type: 'System',
        resource_path: '/decisions/*',
        actions: ['execute'],
        conditions: [`decision_impact <= ${this.agentProperties.max_decision_impact}`],
        time_restrictions: this.generateTimeRestrictions(),
        approval_required: this.agentProperties.human_oversight_required
      })
    }

    // API access permissions based on decision scope
    if (decision_scope === 'Customer-Facing' || decision_scope === 'Cross-System') {
      permissions.push({
        id: 'external_api_access',
        resource_type: 'API',
        resource_path: '/external/*',
        actions: ['read', 'execute'],
        conditions: ['compliance_check_passed'],
        time_restrictions: this.generateBusinessHoursRestrictions(),
        approval_required: decision_scope === 'Cross-System'
      })
    }

    // System administration permissions for high-level agents
    if (agent_type === 'Orchestrator' || autonomy_level === 'Critical') {
      permissions.push({
        id: 'system_administration',
        resource_type: 'System',
        resource_path: '/admin/*',
        actions: ['read', 'write', 'execute'],
        conditions: ['human_oversight_active', 'audit_trail_enabled'],
        time_restrictments: this.generateMaintenanceWindowRestrictions(),
        approval_required: true
      })
    }

    return permissions
  }

  /**
   * Generate base roles based on agent type and autonomy
   */
  private generateBaseRoles(): AgentRole[] {
    const roles: AgentRole[] = []
    const { agent_type, autonomy_level } = this.agentProperties

    // Base agent role
    roles.push({
      role_name: 'agent_base',
      permissions: ['read_internal_data'],
      inherited_permissions: [],
      constraints: ['compliance_frameworks_adhered'],
      valid_from: new Date().toISOString(),
      valid_until: null
    })

    // Decision-making role for autonomous agents
    if (autonomy_level !== 'Low') {
      roles.push({
        role_name: 'decision_maker',
        permissions: ['make_decisions'],
        inherited_permissions: ['agent_base'],
        constraints: ['human_oversight_when_required'],
        valid_from: new Date().toISOString(),
        valid_until: null
      })
    }

    // External interaction role
    if (this.agentProperties.decision_scope !== 'Internal') {
      roles.push({
        role_name: 'external_interactor',
        permissions: ['external_api_access'],
        inherited_permissions: ['decision_maker'],
        constraints: ['data_privacy_compliance'],
        valid_from: new Date().toISOString(),
        valid_until: null
      })
    }

    // Orchestrator role for multi-agent coordination
    if (agent_type === 'Orchestrator') {
      roles.push({
        role_name: 'orchestrator',
        permissions: ['system_administration', 'coordinate_agents'],
        inherited_permissions: ['external_interactor'],
        constraints: ['audit_trail_comprehensive', 'human_oversight_active'],
        valid_from: new Date().toISOString(),
        valid_until: null
      })
    }

    return roles
  }

  /**
   * Generate time restrictions based on agent properties
   */
  private generateTimeRestrictions() {
    const restrictions = []

    // Business hours for customer-facing agents
    if (this.agentProperties.decision_scope === 'Customer-Facing') {
      restrictions.push({
        type: 'BusinessHours' as const,
        start_time: '09:00',
        end_time: '17:00',
        timezone: 'UTC',
        days_of_week: [1, 2, 3, 4, 5] // Monday-Friday
      })
    }

    // Maintenance window for system administration
    if (this.agentProperties.agent_type === 'Orchestrator') {
      restrictions.push({
        type: 'MaintenanceWindow' as const,
        start_time: '02:00',
        end_time: '04:00',
        timezone: 'UTC',
        days_of_week: [0, 1, 2, 3, 4, 5, 6] // All days
      })
    }

    return restrictions
  }

  /**
   * Generate business hours restrictions
   */
  private generateBusinessHoursRestrictions() {
    return [{
      type: 'BusinessHours' as const,
      start_time: '08:00',
      end_time: '18:00',
      timezone: 'UTC',
      days_of_week: [1, 2, 3, 4, 5]
    }]
  }

  /**
   * Generate maintenance window restrictions
   */
  private generateMaintenanceWindowRestrictions() {
    return [{
      type: 'MaintenanceWindow' as const,
      start_time: '01:00',
      end_time: '05:00',
      timezone: 'UTC',
      days_of_week: [0, 6] // Weekend nights
    }]
  }

  /**
   * Check if agent has permission for specific action
   */
  public hasPermission(
    permissionId: string, 
    resourcePath: string, 
    action: string,
    context?: Record<string, any>
  ): boolean {
    const permission = this.permissions.get(permissionId)
    if (!permission) return false

    // Check resource path match
    if (!this.matchesResourcePath(permission.resource_path, resourcePath)) {
      return false
    }

    // Check action permission
    if (!permission.actions.includes(action as any)) {
      return false
    }

    // Check conditions
    if (!this.evaluateConditions(permission.conditions, context)) {
      return false
    }

    // Check time restrictions
    if (!this.checkTimeRestrictions(permission.time_restrictions)) {
      return false
    }

    // Check approval requirement
    if (permission.approval_required) {
      return this.hasApproval(permissionId, context)
    }

    return true
  }

  /**
   * Check if agent has role with required permissions
   */
  public hasRole(roleName: string): boolean {
    return this.roles.has(roleName)
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  public getRolePermissions(roleName: string): string[] {
    const role = this.roles.get(roleName)
    if (!role) return []

    const permissions = new Set<string>()
    const visited = new Set<string>()

    this.collectRolePermissions(roleName, permissions, visited)
    return Array.from(permissions)
  }

  /**
   * Recursively collect role permissions including inherited ones
   */
  private collectRolePermissions(
    roleName: string, 
    permissions: Set<string>, 
    visited: Set<string>
  ): void {
    if (visited.has(roleName)) return
    visited.add(roleName)

    const role = this.roles.get(roleName)
    if (!role) return

    // Add direct permissions
    role.permissions.forEach(permission => permissions.add(permission))

    // Add inherited permissions
    role.inherited_permissions.forEach(inheritedRole => {
      this.collectRolePermissions(inheritedRole, permissions, visited)
    })
  }

  /**
   * Validate agent action against authority boundaries
   */
  public validateActionAgainstBoundaries(
    action: string,
    resourcePath: string,
    context?: Record<string, any>
  ): {
    allowed: boolean
    boundary?: AuthorityBoundary
    violation?: string
  } {
    for (const boundary of this.agentProperties.authority_boundaries) {
      if (this.violatesBoundary(boundary, action, resourcePath, context)) {
        return {
          allowed: false,
          boundary,
          violation: `Action violates ${boundary.name} boundary: ${boundary.description}`
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Create access token for agent session
   */
  public createAccessToken(scopes: string[]): AgentAccessToken {
    const token: AgentAccessToken = {
      token_id: this.generateTokenId(),
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      scopes,
      revoked: false,
      last_used: null
    }

    this.accessTokens.set(token.token_id, token)
    return token
  }

  /**
   * Revoke access token
   */
  public revokeAccessToken(tokenId: string): boolean {
    const token = this.accessTokens.get(tokenId)
    if (!token) return false

    token.revoked = true
    return true
  }

  /**
   * Validate access token
   */
  public validateAccessToken(tokenId: string, requiredScopes: string[]): boolean {
    const token = this.accessTokens.get(tokenId)
    if (!token || token.revoked) return false

    // Check expiration
    if (new Date(token.expires_at) < new Date()) return false

    // Check scopes
    const hasRequiredScopes = requiredScopes.every(scope => token.scopes.includes(scope))
    if (!hasRequiredScopes) return false

    // Update last used
    token.last_used = new Date().toISOString()
    return true
  }

  // Helper methods

  private matchesResourcePath(permissionPath: string, resourcePath: string): boolean {
    // Simple wildcard matching (can be enhanced)
    if (permissionPath.endsWith('/*')) {
      const basePath = permissionPath.slice(0, -2)
      return resourcePath.startsWith(basePath)
    }
    return permissionPath === resourcePath
  }

  private evaluateConditions(conditions: string[], context?: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true
    if (!context) return false

    return conditions.every(condition => {
      // Simple condition evaluation (can be enhanced with proper expression parser)
      if (condition.includes('data_classification')) {
        const requiredLevel = condition.split('<= ')[1]
        return context.data_classification <= this.getNumericDataLevel(requiredLevel)
      }
      if (condition === 'human_oversight_active') {
        return context.human_oversight === true
      }
      if (condition === 'audit_trail_enabled') {
        return context.audit_trail === true
      }
      return true // Default to true for unknown conditions
    })
  }

  private getNumericDataLevel(level: string): number {
    const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3, 'Restricted': 4 }
    return levels[level as keyof typeof levels] || 0
  }

  private checkTimeRestrictions(restrictions: any[]): boolean {
    if (!restrictions || restrictions.length === 0) return true

    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentDay = now.getUTCDay()

    return restrictions.every(restriction => {
      const startHour = parseInt(restriction.start_time.split(':')[0])
      const endHour = parseInt(restriction.end_time.split(':')[0])
      const allowedDays = restriction.days_of_week

      // Check day of week
      if (!allowedDays.includes(currentDay)) return false

      // Check time window
      if (restriction.type === 'BusinessHours') {
        return currentHour >= startHour && currentHour < endHour
      }
      if (restriction.type === 'MaintenanceWindow') {
        return currentHour >= startHour && currentHour < endHour
      }

      return true
    })
  }

  private hasApproval(permissionId: string, context?: Record<string, any>): boolean {
    // Check if approval exists in context
    return context?.approvals?.includes(permissionId) || false
  }

  private violatesBoundary(
    boundary: AuthorityBoundary,
    action: string,
    resourcePath: string,
    context?: Record<string, any>
  ): boolean {
    // Check if action violates boundary constraints
    if (boundary.boundary_type === 'Action') {
      return boundary.constraints.some(constraint => 
        action.includes(constraint) || constraint.includes(action)
      )
    }
    if (boundary.boundary_type === 'Data') {
      return boundary.constraints.some(constraint => 
        resourcePath.includes(constraint)
      )
    }
    return false
  }

  private generateTokenId(): string {
    return `agent_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get complete authorization state for agent
   */
  public getAuthorizationState(): AgentAuthorization {
    return {
      agent_id: this.agentProperties.agent_type || 'unknown',
      permissions: Array.from(this.permissions.values()),
      role_assignments: Array.from(this.roles.values()),
      access_tokens: Array.from(this.accessTokens.values()),
      session_management: {
        session_timeout_minutes: 60,
        max_concurrent_sessions: 3,
        session_logging: true,
        anomaly_detection: true,
        auto_termination: true
      }
    }
  }

  /**
   * Update agent properties and re-calculate permissions
   */
  public updateAgentProperties(newProperties: Partial<AgentProperties>): void {
    this.agentProperties = { ...this.agentProperties, ...newProperties }
    this.initializeDefaultPermissions()
    this.initializeDefaultRoles()
  }
}
