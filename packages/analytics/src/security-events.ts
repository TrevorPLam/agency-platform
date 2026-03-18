/**
 * Security Events Module
 * 
 * Comprehensive security event logging and monitoring system
 * following OWASP guidelines and 2026 security best practices.
 */

import { captureServerEvent } from './server'

/**
 * Security event severity levels
 */
export const SecuritySeverity = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const

export type SecuritySeverity = (typeof SecuritySeverity)[keyof typeof SecuritySeverity]

/**
 * Security event types following OWASP guidelines
 */
export enum SecurityEventType {
  // Authentication Events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_LOCKOUT = 'auth_lockout',
  MFA_FAILURE = 'mfa_failure',
  MFA_BYPASS_ATTEMPT = 'mfa_bypass_attempt',
  
  // Authorization Events
  ACCESS_DENIED = 'access_denied',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  CROSS_TENANT_ACCESS = 'cross_tenant_access',
  UNAUTHORIZED_API_ACCESS = 'unauthorized_api_access',
  
  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_FREQUENCY = 'suspicious_frequency',
  BRUTE_FORCE_DETECTED = 'brute_force_detected',
  
  // Input Validation Events
  INPUT_VALIDATION_FAILURE = 'input_validation_failure',
  MALICIOUS_PAYLOAD = 'malicious_payload',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_DETECTED = 'csrf_detected',
  
  // Application Security Events
  SECURITY_MISCONFIGURATION = 'security_misconfiguration',
  DEPENDENCY_VULNERABILITY = 'dependency_vulnerability',
  SESSION_HIJACKING = 'session_hijacking',
  TOKEN_THEFT = 'token_theft',
  
  // Data Security Events
  DATA_ACCESS_ANOMALY = 'data_access_anomaly',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXFILTRATION_ATTEMPT = 'data_exfiltration_attempt',
  UNAUTHORIZED_DATA_EXPORT = 'unauthorized_data_export',
  
  // Infrastructure Security Events
  TLS_FAILURE = 'tls_failure',
  CERTIFICATE_VALIDATION_FAILURE = 'certificate_validation_failure',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  GEOLOCATION_ANOMALY = 'geolocation_anomaly',
  
  // Business Logic Events
  BUSINESS_LOGIC_VIOLATION = 'business_logic_violation',
  ABNORMAL_BEHAVIOR_PATTERN = 'abnormal_behavior_pattern',
  FRAUD_DETECTED = 'fraud_detected'
}

/**
 * Security event interface following OWASP "when, where, who, what" guidelines
 */
export interface SecurityEvent {
  // When
  timestamp: string
  eventTimestamp?: string
  
  // Where
  application: {
    name: string
    version: string
    endpoint?: string
    method?: string
    statusCode?: number
  }
  source: {
    ip: string
    userAgent?: string
    geolocation?: {
      country?: string
      city?: string
      latitude?: number
      longitude?: number
    }
    hostname?: string
  }
  
  // Who
  actor: {
    userId?: string
    tenantId: string
    sessionId?: string
    email?: string
    role?: string
  }
  
  // What
  eventType: SecurityEventType
  severity: SecuritySeverity
  description: string
  outcome: 'success' | 'failure' | 'blocked' | 'error'
  
  // Additional Context
  context: {
    correlationId?: string
    requestId?: string
    error?: string
    stackTrace?: string
    metadata?: Record<string, unknown>
  }
  
  // Compliance Flags
  compliance: {
    dataBreach?: boolean
    hipaa?: boolean
    pci?: boolean
    gdpr?: boolean
    sox?: boolean
  }
  
  // Threat Intelligence
  threat?: {
    ioc?: string // Indicator of Compromise
    pattern?: string
    confidence?: number
    source?: string
  }
}

/**
 * Security alert types
 */
export enum SecurityAlertType {
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SUSPICIOUS_LOGIN_PATTERN = 'suspicious_login_pattern',
  RATE_LIMIT_ABUSE = 'rate_limit_abuse',
  CROSS_TENANT_ACCESS_ATTEMPT = 'cross_tenant_access_attempt',
  ANOMALOUS_DATA_ACCESS = 'anomalous_data_access',
  VULNERABILITY_DETECTED = 'vulnerability_detected',
  SECURITY_MISCONFIGURATION = 'security_misconfiguration',
  DATA_EXFILTRATION_RISK = 'data_exfiltration_risk',
  MALICIOUS_PAYLOAD_DETECTED = 'malicious_payload_detected',
  INFRASTRUCTURE_COMPROMISE = 'infrastructure_compromise'
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
  id: string
  timestamp: string
  severity: SecuritySeverity
  type: SecurityAlertType
  title: string
  description: string
  tenantId: string
  events: SecurityEvent[]
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  metadata: {
    riskScore: number
    affectedUsers?: number
    affectedSystems?: string[]
    mitigation?: string
    recommendation?: string
  }
}

/**
 * Security metrics interface
 */
export interface SecurityMetrics {
  timeRange: {
    start: string
    end: string
  }
  tenantId?: string
  
  // Event Counts
  totalEvents: number
  criticalEvents: number
  highEvents: number
  mediumEvents: number
  lowEvents: number
  
  // Alert Status
  activeAlerts: number
  acknowledgedAlerts: number
  resolvedAlerts: number
  
  // Security KPIs
  authenticationFailureRate: number
  rateLimitViolationRate: number
  suspiciousActivityRate: number
  dataAccessAnomalyRate: number
  
  // Trends
  trends: {
    authenticationFailures: number[]
    rateLimitViolations: number[]
    suspiciousActivity: number[]
    dataAccessAnomalies: number[]
    timestamps: string[]
  }
  
  // Risk Assessment
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Create a security event with proper validation and defaults
 */
export function createSecurityEvent(params: {
  eventType: SecurityEventType
  severity: SecuritySeverity
  tenantId: string
  description: string
  outcome: 'success' | 'failure' | 'blocked' | 'error'
  application: Partial<SecurityEvent['application']>
  source: Partial<SecurityEvent['source']>
  actor?: Partial<SecurityEvent['actor']>
  context?: Partial<SecurityEvent['context']>
  compliance?: Partial<SecurityEvent['compliance']>
  threat?: Partial<SecurityEvent['threat']>
}): SecurityEvent {
  const timestamp = new Date().toISOString()
  const geolocation = params.source.geolocation
    ? {
        ...(params.source.geolocation.country ? { country: params.source.geolocation.country } : {}),
        ...(params.source.geolocation.city ? { city: params.source.geolocation.city } : {}),
        ...(typeof params.source.geolocation.latitude === 'number'
          ? { latitude: params.source.geolocation.latitude }
          : {}),
        ...(typeof params.source.geolocation.longitude === 'number'
          ? { longitude: params.source.geolocation.longitude }
          : {}),
      }
    : undefined
  const threat = params.threat
    ? {
        ...(params.threat.ioc ? { ioc: params.threat.ioc } : {}),
        ...(params.threat.pattern ? { pattern: params.threat.pattern } : {}),
        ...(typeof params.threat.confidence === 'number'
          ? { confidence: params.threat.confidence }
          : {}),
        ...(params.threat.source ? { source: params.threat.source } : {}),
      }
    : undefined
  
  return {
    timestamp,
    eventTimestamp: timestamp,
    application: {
      name: params.application.name || 'agency-platform',
      version: params.application.version || '1.0.0',
      ...(params.application.endpoint ? { endpoint: params.application.endpoint } : {}),
      ...(params.application.method ? { method: params.application.method } : {}),
      ...(typeof params.application.statusCode === 'number'
        ? { statusCode: params.application.statusCode }
        : {}),
    },
    source: {
      ip: params.source.ip || 'unknown',
      ...(params.source.userAgent ? { userAgent: params.source.userAgent } : {}),
      ...(geolocation ? { geolocation } : {}),
      ...(params.source.hostname ? { hostname: params.source.hostname } : {}),
    },
    actor: {
      tenantId: params.tenantId,
      ...(params.actor?.userId ? { userId: params.actor.userId } : {}),
      ...(params.actor?.sessionId ? { sessionId: params.actor.sessionId } : {}),
      ...(params.actor?.email ? { email: params.actor.email } : {}),
      ...(params.actor?.role ? { role: params.actor.role } : {}),
    },
    eventType: params.eventType,
    severity: params.severity,
    description: params.description,
    outcome: params.outcome,
    context: {
      correlationId: params.context?.correlationId || generateCorrelationId(),
      ...(params.context?.requestId ? { requestId: params.context.requestId } : {}),
      ...(params.context?.error ? { error: params.context.error } : {}),
      ...(params.context?.stackTrace ? { stackTrace: params.context.stackTrace } : {}),
      metadata: params.context?.metadata || {},
    },
    compliance: {
      dataBreach: params.compliance?.dataBreach || false,
      hipaa: params.compliance?.hipaa || false,
      pci: params.compliance?.pci || false,
      gdpr: params.compliance?.gdpr || false,
      sox: params.compliance?.sox || false,
    },
    ...(threat ? { threat } : {}),
  }
}

/**
 * Log a security event to the analytics system
 */
export function logSecurityEvent(event: SecurityEvent): void {
  try {
    // Capture security event in analytics with tenant context
    captureServerEvent(
      event.actor.userId || 'anonymous',
      `security:${event.eventType}`,
      {
        tenant: event.actor.tenantId,
        severity: event.severity,
        outcome: event.outcome,
        eventType: event.eventType,
        description: event.description,
        application: event.application.name,
        endpoint: event.application.endpoint,
        method: event.application.method,
        statusCode: event.application.statusCode,
        sourceIp: event.source.ip,
        userAgent: event.source.userAgent,
        geolocation: event.source.geolocation?.country,
        userId: event.actor.userId,
        role: event.actor.role,
        correlationId: event.context.correlationId,
        compliance: event.compliance,
        riskScore: calculateRiskScore(event),
        timestamp: event.timestamp,
      }
    )
  } catch (error) {
    // Fail silently to avoid breaking application functionality
    console.error('Failed to log security event:', error)
  }
}

/**
 * Calculate risk score for a security event
 */
function calculateRiskScore(event: SecurityEvent): number {
  let score = 0
  
  // Base score by severity
  switch (event.severity) {
    case 'critical': score += 80; break
    case 'high': score += 60; break
    case 'medium': score += 40; break
    case 'low': score += 20; break
  }
  
  // Event type modifiers
  const criticalEvents = [
    SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
    SecurityEventType.SESSION_HIJACKING,
    SecurityEventType.TOKEN_THEFT,
    SecurityEventType.CROSS_TENANT_ACCESS,
  ]
  
  if (criticalEvents.includes(event.eventType)) {
    score += 20
  }
  
  // Compliance impact
  if (event.compliance.dataBreach) score += 15
  if (event.compliance.hipaa) score += 10
  if (event.compliance.pci) score += 10
  
  // Outcome impact
  if (event.outcome === 'success' && event.severity === 'critical') score += 10
  
  return Math.min(score, 100)
}

/**
 * Generate correlation ID for security events
 */
function generateCorrelationId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper functions for common security event patterns
 */

export const SecurityEvents = {
  /**
   * Log authentication failure
   */
  authFailure: (params: {
    tenantId: string
    email?: string
    ip: string
    userAgent?: string
    reason?: string
  }) => {
    const event = createSecurityEvent({
      eventType: SecurityEventType.AUTH_FAILURE,
      severity: 'medium',
      tenantId: params.tenantId,
      description: `Authentication failure${params.reason ? `: ${params.reason}` : ''}`,
      outcome: 'failure',
      application: { name: 'agency-platform' },
      source: {
        ip: params.ip,
        ...(params.userAgent ? { userAgent: params.userAgent } : {}),
      },
      actor: {
        ...(params.email ? { email: params.email } : {}),
      },
      context: { metadata: { reason: params.reason } },
    })
    logSecurityEvent(event)
    return event
  },

  /**
   * Log rate limit violation
   */
  rateLimitViolation: (params: {
    tenantId: string
    userId?: string
    ip: string
    endpoint?: string
    limit: number
    window: string
  }) => {
    const event = createSecurityEvent({
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      tenantId: params.tenantId,
      description: `Rate limit exceeded: ${params.limit} requests per ${params.window}`,
      outcome: 'blocked',
      application: {
        name: 'agency-platform',
        ...(params.endpoint ? { endpoint: params.endpoint } : {}),
      },
      source: { ip: params.ip },
      actor: {
        ...(params.userId ? { userId: params.userId } : {}),
      },
      context: { metadata: { limit: params.limit, window: params.window } },
    })
    logSecurityEvent(event)
    return event
  },

  /**
   * Log cross-tenant access attempt
   */
  crossTenantAccess: (params: {
    tenantId: string
    userId?: string
    ip: string
    targetTenantId: string
    endpoint?: string
  }) => {
    const event = createSecurityEvent({
      eventType: SecurityEventType.CROSS_TENANT_ACCESS,
      severity: 'critical',
      tenantId: params.tenantId,
      description: `Cross-tenant access attempt to ${params.targetTenantId}`,
      outcome: 'blocked',
      application: {
        name: 'agency-platform',
        ...(params.endpoint ? { endpoint: params.endpoint } : {}),
      },
      source: { ip: params.ip },
      actor: {
        ...(params.userId ? { userId: params.userId } : {}),
      },
      context: { metadata: { targetTenantId: params.targetTenantId } },
      compliance: { dataBreach: true },
    })
    logSecurityEvent(event)
    return event
  },

  /**
   * Log suspicious activity pattern
   */
  suspiciousActivity: (params: {
    tenantId: string
    userId?: string
    ip: string
    pattern: string
    riskScore?: number
  }) => {
    const event = createSecurityEvent({
      eventType: SecurityEventType.ABNORMAL_BEHAVIOR_PATTERN,
      severity: params.riskScore && params.riskScore > 70 ? 'high' : 'medium',
      tenantId: params.tenantId,
      description: `Suspicious activity pattern detected: ${params.pattern}`,
      outcome: 'blocked',
      application: { name: 'agency-platform' },
      source: { ip: params.ip },
      actor: {
        ...(params.userId ? { userId: params.userId } : {}),
      },
      context: { metadata: { pattern: params.pattern, riskScore: params.riskScore } },
    })
    logSecurityEvent(event)
    return event
  },

  /**
   * Log input validation failure
   */
  inputValidationFailure: (params: {
    tenantId: string
    userId?: string
    ip: string
    field?: string
    value?: string
    reason?: string
  }) => {
    const event = createSecurityEvent({
      eventType: SecurityEventType.INPUT_VALIDATION_FAILURE,
      severity: 'medium',
      tenantId: params.tenantId,
      description: `Input validation failure${params.field ? ` on ${params.field}` : ''}${params.reason ? `: ${params.reason}` : ''}`,
      outcome: 'failure',
      application: { name: 'agency-platform' },
      source: { ip: params.ip },
      actor: {
        ...(params.userId ? { userId: params.userId } : {}),
      },
      context: { 
        metadata: { 
          field: params.field, 
          value: params.value?.substring(0, 100), // Limit value length
          reason: params.reason 
        } 
      },
    })
    logSecurityEvent(event)
    return event
  },
}

export * from './server'
