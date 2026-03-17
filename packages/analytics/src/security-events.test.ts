/**
 * Security Events Tests
 *
 * Comprehensive test suite for security event logging and monitoring
 * following OWASP guidelines and 2026 security best practices.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SecurityEventType,
  createSecurityEvent,
  logSecurityEvent,
  SecurityEvents,
} from './security-events'
import { securityMonitoringEngine } from './security-monitoring'

// Mock the analytics server module
vi.mock('./server', () => ({
  captureServerEvent: vi.fn(),
}))

describe('Security Events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSecurityEvent', () => {
    it('should create a valid security event with required fields', () => {
      const event = createSecurityEvent({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        tenantId: 'tenant-123',
        description: 'Authentication failed',
        outcome: 'failure',
        application: { name: 'test-app' },
        source: { ip: '192.168.1.1' },
      })

      expect(event).toMatchObject({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        actor: { tenantId: 'tenant-123' },
        description: 'Authentication failed',
        outcome: 'failure',
        application: { name: 'test-app', version: '1.0.0' },
        source: { ip: '192.168.1.1' },
        compliance: {
          dataBreach: false,
          hipaa: false,
          pci: false,
          gdpr: false,
          sox: false,
        },
      })
      expect(event.timestamp).toBeDefined()
      expect(event.context.correlationId).toBeDefined()
    })

    it('should handle optional fields correctly', () => {
      const event = createSecurityEvent({
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'high',
        tenantId: 'tenant-123',
        description: 'Rate limit exceeded',
        outcome: 'blocked',
        application: {
          name: 'test-app',
          endpoint: '/api/test',
          method: 'POST',
          statusCode: 429,
        },
        source: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          geolocation: { country: 'US', city: 'New York' },
        },
        actor: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'user',
        },
        context: {
          error: 'Rate limit exceeded',
          metadata: { limit: 100, window: '1h' },
        },
        compliance: {
          dataBreach: false,
          hipaa: true,
        },
        threat: {
          ioc: 'ioc-001',
          pattern: 'brute-force',
          confidence: 0.9,
        },
      })

      expect(event.application.endpoint).toBe('/api/test')
      expect(event.application.method).toBe('POST')
      expect(event.application.statusCode).toBe(429)
      expect(event.source.userAgent).toBe('Mozilla/5.0')
      expect(event.source.geolocation?.country).toBe('US')
      expect(event.actor.userId).toBe('user-123')
      expect(event.actor.email).toBe('test@example.com')
      expect(event.context.error).toBe('Rate limit exceeded')
      expect(event.context.metadata?.limit).toBe(100)
      expect(event.compliance.hipaa).toBe(true)
      expect(event.threat?.ioc).toBe('ioc-001')
    })

    it('should generate correlation ID when not provided', () => {
      const event = createSecurityEvent({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        tenantId: 'tenant-123',
        description: 'Test event',
        outcome: 'failure',
        application: { name: 'test-app' },
        source: { ip: '192.168.1.1' },
      })

      expect(event.context.correlationId).toMatch(/^sec_\d+_[a-z0-9]+$/)
    })
  })

  describe('logSecurityEvent', () => {
    it('should log security event to analytics', async () => {
      const { captureServerEvent } = await import('./server')

      const event = createSecurityEvent({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        tenantId: 'tenant-123',
        description: 'Test event',
        outcome: 'failure',
        application: { name: 'test-app' },
        source: { ip: '192.168.1.1' },
      })

      logSecurityEvent(event)

      expect(captureServerEvent).toHaveBeenCalledWith(
        'anonymous',
        'security:auth_failure',
        expect.objectContaining({
          tenant: 'tenant-123',
          severity: 'medium',
          outcome: 'failure',
          eventType: 'auth_failure',
          description: 'Test event',
          application: 'test-app',
          sourceIp: '192.168.1.1',
        })
      )
    })

    it('should handle logging errors gracefully', async () => {
      const { captureServerEvent } = await import('./server')
      ;(captureServerEvent as any).mockImplementation(() => {
        throw new Error('Analytics error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event = createSecurityEvent({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        tenantId: 'tenant-123',
        description: 'Test event',
        outcome: 'failure',
        application: { name: 'test-app' },
        source: { ip: '192.168.1.1' },
      })

      expect(() => logSecurityEvent(event)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log security event:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('SecurityEvents helpers', () => {
    describe('authFailure', () => {
      it('should create authentication failure event', () => {
        const event = SecurityEvents.authFailure({
          tenantId: 'tenant-123',
          email: 'test@example.com',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          reason: 'Invalid password',
        })

        expect(event.eventType).toBe(SecurityEventType.AUTH_FAILURE)
        expect(event.severity).toBe('medium')
        expect(event.actor.tenantId).toBe('tenant-123')
        expect(event.actor.email).toBe('test@example.com')
        expect(event.source.ip).toBe('192.168.1.1')
        expect(event.source.userAgent).toBe('Mozilla/5.0')
        expect(event.context.metadata?.reason).toBe('Invalid password')
      })
    })

    describe('rateLimitViolation', () => {
      it('should create rate limit violation event', () => {
        const event = SecurityEvents.rateLimitViolation({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          endpoint: '/api/test',
          limit: 100,
          window: '1h',
        })

        expect(event.eventType).toBe(SecurityEventType.RATE_LIMIT_EXCEEDED)
        expect(event.severity).toBe('high')
        expect(event.actor.tenantId).toBe('tenant-123')
        expect(event.actor.userId).toBe('user-123')
        expect(event.source.ip).toBe('192.168.1.1')
        expect(event.application.endpoint).toBe('/api/test')
        expect(event.context.metadata?.limit).toBe(100)
        expect(event.context.metadata?.window).toBe('1h')
      })
    })

    describe('crossTenantAccess', () => {
      it('should create cross-tenant access event', () => {
        const event = SecurityEvents.crossTenantAccess({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          targetTenantId: 'tenant-456',
          endpoint: '/api/admin/users',
        })

        expect(event.eventType).toBe(SecurityEventType.CROSS_TENANT_ACCESS)
        expect(event.severity).toBe('critical')
        expect(event.actor.tenantId).toBe('tenant-123')
        expect(event.actor.userId).toBe('user-123')
        expect(event.source.ip).toBe('192.168.1.1')
        expect(event.application.endpoint).toBe('/api/admin/users')
        expect(event.context.metadata?.targetTenantId).toBe('tenant-456')
        expect(event.compliance.dataBreach).toBe(true)
      })
    })

    describe('suspiciousActivity', () => {
      it('should create suspicious activity event', () => {
        const event = SecurityEvents.suspiciousActivity({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          pattern: 'rapid_login_attempts',
          riskScore: 75,
        })

        expect(event.eventType).toBe(SecurityEventType.ABNORMAL_BEHAVIOR_PATTERN)
        expect(event.severity).toBe('high')
        expect(event.actor.tenantId).toBe('tenant-123')
        expect(event.actor.userId).toBe('user-123')
        expect(event.source.ip).toBe('192.168.1.1')
        expect(event.context.metadata?.pattern).toBe('rapid_login_attempts')
        expect(event.context.metadata?.riskScore).toBe(75)
      })

      it('should adjust severity based on risk score', () => {
        const lowRiskEvent = SecurityEvents.suspiciousActivity({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          pattern: 'minor_anomaly',
          riskScore: 30,
        })

        const highRiskEvent = SecurityEvents.suspiciousActivity({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          pattern: 'major_anomaly',
          riskScore: 85,
        })

        expect(lowRiskEvent.severity).toBe('medium')
        expect(highRiskEvent.severity).toBe('high')
      })
    })

    describe('inputValidationFailure', () => {
      it('should create input validation failure event', () => {
        const event = SecurityEvents.inputValidationFailure({
          tenantId: 'tenant-123',
          userId: 'user-123',
          ip: '192.168.1.1',
          field: 'email',
          value: 'invalid-email',
          reason: 'Invalid email format',
        })

        expect(event.eventType).toBe(SecurityEventType.INPUT_VALIDATION_FAILURE)
        expect(event.severity).toBe('medium')
        expect(event.actor.tenantId).toBe('tenant-123')
        expect(event.actor.userId).toBe('user-123')
        expect(event.source.ip).toBe('192.168.1.1')
        expect(event.context.metadata?.field).toBe('email')
        expect(event.context.metadata?.reason).toBe('Invalid email format')
      })

      it('should limit value length for security', () => {
        const longValue = 'a'.repeat(200)
        const event = SecurityEvents.inputValidationFailure({
          tenantId: 'tenant-123',
          ip: '192.168.1.1',
          field: 'comment',
          value: longValue,
        })

        expect(event.context.metadata?.value).toHaveLength(100)
        expect(event.context.metadata?.value).toBe('a'.repeat(100))
      })
    })
  })

  describe('Integration with Security Monitoring Engine', () => {
    it('should add events to monitoring engine', async () => {
      const event = createSecurityEvent({
        eventType: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        tenantId: 'tenant-123',
        description: 'Test event',
        outcome: 'failure',
        application: { name: 'test-app' },
        source: { ip: '192.168.1.1' },
      })

      await securityMonitoringEngine.addEvents([event])

      const metrics = securityMonitoringEngine.calculateMetrics('tenant-123')
      expect(metrics.totalEvents).toBeGreaterThan(0)
    })
  })
})
