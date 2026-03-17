/**
 * Security Monitoring Integration
 *
 * Integrates security monitoring with existing rate limiting and authentication systems
 * to provide comprehensive security event logging and alerting.
 */

import type { NextRequest } from 'next/server'
import { RateLimitResult, RateLimitContext } from './rate-limiter'

// Mock analytics imports for now - will be implemented when analytics package is ready
interface MockSecurityEvents {
  RATE_LIMIT_VIOLATION: string
  AUTHENTICATION_FAILURE: string
  SUSPICIOUS_PATTERN: string
  CROSS_TENANT_ACCESS: string
  INPUT_VALIDATION_FAILURE: string
  rateLimitViolation: (data: any) => any
  authFailure: (data: any) => any
  suspiciousActivity: (data: any) => any
  crossTenantAccess: (data: any) => any
  inputValidationFailure: (data: any) => any
}

interface MockSecurityMonitoringEngine {
  captureEvent: (event: string, context: any) => Promise<void>
  addEvents: (events: any[]) => Promise<void>
}

const processSecurityAlerts = async (alerts: any[]) => {
  // Mock implementation - will be replaced with real analytics
  console.log('Security alerts processed:', alerts.length)
}

const SecurityEvents: MockSecurityEvents = {
  RATE_LIMIT_VIOLATION: 'rate_limit_violation',
  AUTHENTICATION_FAILURE: 'authentication_failure',
  SUSPICIOUS_PATTERN: 'suspicious_pattern',
  CROSS_TENANT_ACCESS: 'cross_tenant_access',
  INPUT_VALIDATION_FAILURE: 'input_validation_failure',
  rateLimitViolation: (data: any) => ({ type: 'rate_limit_violation', ...data }),
  authFailure: (data: any) => ({ type: 'authentication_failure', ...data }),
  suspiciousActivity: (data: any) => ({ type: 'suspicious_pattern', ...data }),
  crossTenantAccess: (data: any) => ({ type: 'cross_tenant_access', ...data }),
  inputValidationFailure: (data: any) => ({ type: 'input_validation_failure', ...data }),
}

const securityMonitoringEngine: MockSecurityMonitoringEngine = {
  captureEvent: async (event: string, context: any) => {
    // Mock implementation - will be replaced with real analytics
    console.log('Security event captured:', event, context)
  },
  addEvents: async (events: any[]) => {
    // Mock implementation - will be replaced with real analytics
    console.log('Security events added:', events.length)
  },
}

/**
 * Security monitoring configuration
 */
export interface SecurityMonitoringConfig {
  /** Enable security event logging */
  enableLogging: boolean
  /** Enable automatic alerting */
  enableAlerting: boolean
  /** Log rate limit violations */
  logRateLimitViolations: boolean
  /** Log authentication failures */
  logAuthFailures: boolean
  /** Log suspicious patterns */
  logSuspiciousPatterns: boolean
  /** Tenant ID for multi-tenant isolation */
  tenantId?: string
}

/**
 * Security monitoring context
 */
export interface SecurityMonitoringContext {
  /** Request context */
  request: NextRequest
  /** Rate limit context */
  rateLimitContext: RateLimitContext
  /** Authentication context */
  authContext?: {
    userId?: string
    email?: string
    role?: string
    sessionId?: string
  }
  /** Request metadata */
  metadata?: {
    endpoint?: string
    method?: string
    userAgent?: string
    referer?: string
  }
}

/**
 * Security monitoring integration class
 */
export class SecurityMonitoringIntegration {
  private config: SecurityMonitoringConfig

  constructor(config: SecurityMonitoringConfig) {
    this.config = config
  }

  /**
   * Handle rate limit violation
   */
  async handleRateLimitViolation(
    context: SecurityMonitoringContext,
    result: RateLimitResult
  ): Promise<void> {
    if (!this.config.enableLogging || !this.config.logRateLimitViolations) {
      return
    }

    try {
      // Log rate limit violation event
      const event = SecurityEvents.rateLimitViolation({
        tenantId: this.config.tenantId || context.rateLimitContext.tenantId || 'unknown',
        userId: context.authContext?.userId,
        ip: context.rateLimitContext.ip,
        endpoint: context.metadata?.endpoint,
        limit: result.limit,
        window: this.getWindowDuration(result),
      })

      // Add to monitoring engine
      await securityMonitoringEngine.addEvents([event])

      // Process alerts
      if (this.config.enableAlerting) {
        await processSecurityAlerts([event])
      }

    } catch (error) {
      console.error('Failed to handle rate limit violation:', error)
    }
  }

  /**
   * Handle authentication failure
   */
  async handleAuthenticationFailure(
    context: SecurityMonitoringContext,
    reason?: string
  ): Promise<void> {
    if (!this.config.enableLogging || !this.config.logAuthFailures) {
      return
    }

    try {
      // Log authentication failure event
      const event = SecurityEvents.authFailure({
        tenantId: this.config.tenantId || context.rateLimitContext.tenantId || 'unknown',
        email: context.authContext?.email,
        ip: context.rateLimitContext.ip,
        userAgent: context.metadata?.userAgent,
        reason,
      })

      // Add to monitoring engine
      await securityMonitoringEngine.addEvents([event])

      // Process alerts
      if (this.config.enableAlerting) {
        await processSecurityAlerts([event])
      }

    } catch (error) {
      console.error('Failed to handle authentication failure:', error)
    }
  }

  /**
   * Handle suspicious activity pattern
   */
  async handleSuspiciousActivity(
    context: SecurityMonitoringContext,
    pattern: string,
    riskScore?: number
  ): Promise<void> {
    if (!this.config.enableLogging || !this.config.logSuspiciousPatterns) {
      return
    }

    try {
      // Log suspicious activity event
      const event = SecurityEvents.suspiciousActivity({
        tenantId: this.config.tenantId || context.rateLimitContext.tenantId || 'unknown',
        userId: context.authContext?.userId,
        ip: context.rateLimitContext.ip,
        pattern,
        riskScore,
      })

      // Add to monitoring engine
      await securityMonitoringEngine.addEvents([event])

      // Process alerts
      if (this.config.enableAlerting) {
        await processSecurityAlerts([event])
      }

    } catch (error) {
      console.error('Failed to handle suspicious activity:', error)
    }
  }

  /**
   * Handle cross-tenant access attempt
   */
  async handleCrossTenantAccess(
    context: SecurityMonitoringContext,
    targetTenantId: string
  ): Promise<void> {
    if (!this.config.enableLogging) {
      return
    }

    try {
      // Log cross-tenant access attempt
      const event = SecurityEvents.crossTenantAccess({
        tenantId: this.config.tenantId || context.rateLimitContext.tenantId || 'unknown',
        userId: context.authContext?.userId,
        ip: context.rateLimitContext.ip,
        targetTenantId,
        endpoint: context.metadata?.endpoint,
      })

      // Add to monitoring engine
      await securityMonitoringEngine.addEvents([event])

      // Process alerts (always for cross-tenant access)
      await processSecurityAlerts([event])

    } catch (error) {
      console.error('Failed to handle cross-tenant access:', error)
    }
  }

  /**
   * Handle input validation failure
   */
  async handleInputValidationFailure(
    context: SecurityMonitoringContext,
    field?: string,
    value?: string,
    reason?: string
  ): Promise<void> {
    if (!this.config.enableLogging) {
      return
    }

    try {
      // Log input validation failure
      const event = SecurityEvents.inputValidationFailure({
        tenantId: this.config.tenantId || context.rateLimitContext.tenantId || 'unknown',
        userId: context.authContext?.userId,
        ip: context.rateLimitContext.ip,
        field,
        value,
        reason,
      })

      // Add to monitoring engine
      await securityMonitoringEngine.addEvents([event])

      // Process alerts
      if (this.config.enableAlerting) {
        await processSecurityAlerts([event])
      }

    } catch (error) {
      console.error('Failed to handle input validation failure:', error)
    }
  }

  /**
   * Analyze request for suspicious patterns
   */
  async analyzeRequest(context: SecurityMonitoringContext): Promise<void> {
    if (!this.config.enableLogging || !this.config.logSuspiciousPatterns) {
      return
    }

    const suspiciousPatterns = this.detectSuspiciousPatterns(context)

    for (const pattern of suspiciousPatterns) {
      await this.handleSuspiciousActivity(context, pattern.type, pattern.riskScore)
    }
  }

  /**
   * Detect suspicious patterns in request
   */
  private detectSuspiciousPatterns(context: SecurityMonitoringContext): Array<{
    type: string
    riskScore: number
  }> {
    const patterns: Array<{ type: string; riskScore: number }> = []

    // Check for suspicious user agent
    const userAgent = context.metadata?.userAgent || ''
    if (this.isSuspiciousUserAgent(userAgent)) {
      patterns.push({
        type: 'suspicious_user_agent',
        riskScore: 30,
      })
    }

    // Check for unusual request patterns
    const referer = context.metadata?.referer || ''
    if (this.isSuspiciousReferer(referer, context.metadata?.endpoint)) {
      patterns.push({
        type: 'suspicious_referer',
        riskScore: 20,
      })
    }

    // Check for rapid requests (would need request history)
    // This is a placeholder for more sophisticated pattern detection

    return patterns
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /sqlmap/i,
      /nmap/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /java/i,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Check if referer is suspicious
   */
  private isSuspiciousReferer(referer: string, endpoint?: string): boolean {
    if (!referer) return false // No referer is not necessarily suspicious

    // Check for external referers to admin endpoints
    if (endpoint?.includes('/admin') || endpoint?.includes('/api/')) {
      try {
        const refererUrl = new URL(referer)
        const currentHost = new URL(endpoint || 'https://localhost').host

        // External referer to admin endpoint is suspicious
        if (refererUrl.host !== currentHost) {
          return true
        }
      } catch {
        // Invalid URL is suspicious
        return true
      }
    }

    return false
  }

  /**
   * Get window duration from rate limit result
   */
  private getWindowDuration(result: RateLimitResult): string {
    // Estimate window duration based on reset time
    const now = Math.floor(Date.now() / 1000)
    const duration = result.resetTime - now

    if (duration <= 60) return `${duration} seconds`
    if (duration <= 3600) return `${Math.floor(duration / 60)} minutes`
    return `${Math.floor(duration / 3600)} hours`
  }

  /**
   * Create monitoring context from request
   */
  static createContext(
    request: NextRequest,
    rateLimitContext: RateLimitContext,
    authContext?: SecurityMonitoringContext['authContext']
  ): SecurityMonitoringContext {
    return {
      request,
      rateLimitContext,
      authContext: authContext || undefined,
      metadata: {
        endpoint: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent') || '',
        referer: request.headers.get('referer') || '',
      },
    } as SecurityMonitoringContext
  }
}

/**
 * Default security monitoring integration
 */
export const defaultSecurityMonitoring = new SecurityMonitoringIntegration({
  enableLogging: true,
  enableAlerting: true,
  logRateLimitViolations: true,
  logAuthFailures: true,
  logSuspiciousPatterns: true,
})

/**
 * Middleware helper for security monitoring
 */
export async function applySecurityMonitoring(
  request: NextRequest,
  rateLimitContext: RateLimitContext,
  authContext?: SecurityMonitoringContext['authContext'],
  config?: Partial<SecurityMonitoringConfig>
): Promise<{
  rateLimitViolation?: (result: RateLimitResult) => Promise<void>
  authFailure?: (reason?: string) => Promise<void>
  suspiciousActivity?: (pattern: string, riskScore?: number) => Promise<void>
  crossTenantAccess?: (targetTenantId: string) => Promise<void>
  inputValidationFailure?: (field?: string, value?: string, reason?: string) => Promise<void>
  analyzeRequest: () => Promise<void>
}> {
  const monitoring = new SecurityMonitoringIntegration({
    enableLogging: true,
    enableAlerting: true,
    logRateLimitViolations: true,
    logAuthFailures: true,
    logSuspiciousPatterns: true,
    ...config,
  })

  const context = SecurityMonitoringIntegration.createContext(request, rateLimitContext, authContext)

  return {
    rateLimitViolation: (result: RateLimitResult) =>
      monitoring.handleRateLimitViolation(context, result),
    authFailure: (reason?: string) =>
      monitoring.handleAuthenticationFailure(context, reason),
    suspiciousActivity: (pattern: string, riskScore?: number) =>
      monitoring.handleSuspiciousActivity(context, pattern, riskScore),
    crossTenantAccess: (targetTenantId: string) =>
      monitoring.handleCrossTenantAccess(context, targetTenantId),
    inputValidationFailure: (field?: string, value?: string, reason?: string) =>
      monitoring.handleInputValidationFailure(context, field, value, reason),
    analyzeRequest: () => monitoring.analyzeRequest(context),
  }
}
