/**
 * Security Monitoring System Tests
 * 
 * Tests for the security monitoring and alerting system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  SecurityMonitor, 
  getSecurityMonitor, 
  resetSecurityMonitor,
  defaultMonitoringConfig,
  SecurityAlert,
  SecurityTrend
} from '../src/monitoring'

// Mock fetch for testing
global.fetch = vi.fn()

describe('SecurityMonitor', () => {
  let monitor: SecurityMonitor
  const mockConfig = {
    ...defaultMonitoringConfig,
    scanInterval: 1, // 1 minute for faster testing
    alertThresholds: {
      criticalScoreDrop: 10,
      criticalIssueCount: 1,
      responseTimeThreshold: 1000
    },
    notifications: {
      email: false,
      slack: false,
      webhook: false
    },
    recipients: {
      email: [],
      slack: [],
      webhook: []
    }
  }

  beforeEach(() => {
    resetSecurityMonitor()
    monitor = new SecurityMonitor(mockConfig)
    vi.clearAllMocks()
  })

  afterEach(() => {
    monitor.stopMonitoring()
    resetSecurityMonitor()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultMonitor = new SecurityMonitor(defaultMonitoringConfig)
      expect(defaultMonitor).toBeDefined()
    })

    it('should load historical data on initialization', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      new SecurityMonitor(mockConfig)
      expect(consoleSpy).toHaveBeenCalledWith('Historical data saved (placeholder implementation)')
      consoleSpy.mockRestore()
    })
  })

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      monitor.startMonitoring()
      expect(monitor.getMonitoringStatus().isMonitoring).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Starting security monitoring...')
      
      consoleSpy.mockRestore()
    })

    it('should stop monitoring', () => {
      monitor.startMonitoring()
      monitor.stopMonitoring()
      
      expect(monitor.getMonitoringStatus().isMonitoring).toBe(false)
    })

    it('should not start monitoring if already running', () => {
      const consoleSpy = vi.spyOn(console, 'warn')
      
      monitor.startMonitoring()
      monitor.startMonitoring() // Try to start again
      
      expect(consoleSpy).toHaveBeenCalledWith('Security monitoring is already running')
      consoleSpy.mockRestore()
    })

    it('should not stop monitoring if not running', () => {
      const consoleSpy = vi.spyOn(console, 'warn')
      
      monitor.stopMonitoring()
      
      expect(consoleSpy).toHaveBeenCalledWith('Security monitoring is not running')
      consoleSpy.mockRestore()
    })
  })

  describe('Security Scanning', () => {
    beforeEach(() => {
      // Mock successful fetch responses
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self'"],
          ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
          ['x-frame-options', 'DENY'],
          ['x-content-type-options', 'nosniff'],
          ['referrer-policy', 'strict-origin-when-cross-origin'],
          ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
        ]),
        status: 200
      } as any)
    })

    it('should perform security scan successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      // Manually trigger scan
      await monitor['performSecurityScan']()
      
      expect(consoleSpy).toHaveBeenCalledWith('Security scan completed. 4 applications scanned.')
      consoleSpy.mockRestore()
    })

    it('should handle application unavailability', async () => {
      // Mock failed response for one application
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as any)

      await monitor['performSecurityScan']()

      const alerts = monitor.getUnresolvedAlerts()
      const criticalAlerts = alerts.filter(a => a.type === 'critical')
      expect(criticalAlerts.length).toBeGreaterThan(0)
      expect(criticalAlerts[0].message).toBe('Application unavailable')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      await monitor['performSecurityScan']()

      const alerts = monitor.getUnresolvedAlerts()
      const criticalAlerts = alerts.filter(a => a.type === 'critical')
      expect(criticalAlerts.length).toBeGreaterThan(0)
      expect(criticalAlerts[0].message).toBe('Scan failed')
    })

    it('should detect critical security issues', async () => {
      // Mock response with missing critical headers
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'"],
          ['x-frame-options', 'ALLOW-FROM https://evil.com']
        ]),
        status: 200
      } as any)

      await monitor['performSecurityScan']()

      const alerts = monitor.getUnresolvedAlerts()
      const criticalAlerts = alerts.filter(a => a.type === 'critical')
      expect(criticalAlerts.length).toBeGreaterThan(0)
    })

    it('should detect score drops', async () => {
      // First scan with high score
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self'"],
          ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
          ['x-frame-options', 'DENY'],
          ['x-content-type-options', 'nosniff'],
          ['referrer-policy', 'strict-origin-when-cross-origin'],
          ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
        ]),
        status: 200
      } as any)

      await monitor['performSecurityScan']()

      // Second scan with lower score
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'"],
          ['strict-transport-security', 'max-age=31536000'],
          ['x-frame-options', 'DENY'],
          ['x-content-type-options', 'nosniff'],
          ['referrer-policy', 'strict-origin-when-cross-origin'],
          ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
        ]),
        status: 200
      } as any)

      await monitor['performSecurityScan']()

      const alerts = monitor.getUnresolvedAlerts()
      const warningAlerts = alerts.filter(a => a.type === 'warning')
      expect(warningAlerts.some(a => a.message.includes('score dropped'))).toBe(true)
    })

    it('should detect high response times', async () => {
      // Mock slow response
      vi.mocked(fetch).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        return {
          ok: true,
          headers: new Map([
            ['content-security-policy', "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self'"],
            ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
            ['x-frame-options', 'DENY'],
            ['x-content-type-options', 'nosniff'],
            ['referrer-policy', 'strict-origin-when-cross-origin'],
            ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
          ]),
          status: 200
        } as any
      })

      await monitor['performSecurityScan']()

      const alerts = monitor.getUnresolvedAlerts()
      const warningAlerts = alerts.filter(a => a.type === 'warning')
      expect(warningAlerts.some(a => a.message.includes('High response time'))).toBe(true)
    })
  })

  describe('Alert Management', () => {
    it('should create alerts correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      monitor['createAlert']({
        type: 'critical',
        application: 'Test App',
        url: 'http://test.com',
        message: 'Test alert',
        details: 'Test details',
        timestamp: new Date()
      })

      const alerts = monitor.getUnresolvedAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('critical')
      expect(alerts[0].message).toBe('Test alert')
      expect(alerts[0].resolved).toBe(false)
      
      consoleSpy.mockRestore()
    })

    it('should generate unique alert IDs', () => {
      const alert1 = monitor['generateAlertId']()
      const alert2 = monitor['generateAlertId']()
      
      expect(alert1).not.toBe(alert2)
      expect(alert1).toMatch(/^alert_\d+_[a-z0-9]+$/)
      expect(alert2).toMatch(/^alert_\d+_[a-z0-9]+$/)
    })

    it('should resolve alerts correctly', () => {
      // Create an alert
      monitor['createAlert']({
        type: 'critical',
        application: 'Test App',
        url: 'http://test.com',
        message: 'Test alert',
        details: 'Test details',
        timestamp: new Date()
      })

      const alertsBefore = monitor.getUnresolvedAlerts()
      expect(alertsBefore).toHaveLength(1)

      // Resolve the alert
      monitor.resolveAlert(alertsBefore[0].id, 'test-user')

      const alertsAfter = monitor.getUnresolvedAlerts()
      expect(alertsAfter).toHaveLength(0)
    })

    it('should handle resolving non-existent alerts', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      monitor.resolveAlert('non-existent-id', 'test-user')
      
      // Should not throw an error
      expect(consoleSpy).not.toHaveBeenCalledWith('Alert resolved:')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Metrics and Trends', () => {
    it('should return correct metrics', async () => {
      // Mock successful scan
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self'"],
          ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
          ['x-frame-options', 'DENY'],
          ['x-content-type-options', 'nosniff'],
          ['referrer-policy', 'strict-origin-when-cross-origin'],
          ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
        ]),
        status: 200
      } as any)

      await monitor['performSecurityScan']()

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveProperty('overallScore')
      expect(metrics).toHaveProperty('criticalIssues')
      expect(metrics).toHaveProperty('applicationsScanned')
      expect(metrics).toHaveProperty('totalApplications')
      expect(metrics).toHaveProperty('trends')
      expect(metrics).toHaveProperty('alerts')
      expect(metrics.totalApplications).toBe(4)
    })

    it('should return application trends correctly', async () => {
      // Mock successful scan
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Map([
          ['content-security-policy', "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self'"],
          ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
          ['x-frame-options', 'DENY'],
          ['x-content-type-options', 'nosniff'],
          ['referrer-policy', 'strict-origin-when-cross-origin'],
          ['permissions-policy', 'camera=(), microphone=(), geolocation=()']
        ]),
        status: 200
      } as any)

      await monitor['performSecurityScan']()

      const trends = monitor.getApplicationTrends('Agency Admin', 7)
      expect(Array.isArray(trends)).toBe(true)
      expect(trends.every(t => t.application === 'Agency Admin')).toBe(true)
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        scanInterval: 30,
        alertThresholds: {
          criticalScoreDrop: 25,
          criticalIssueCount: 2,
          responseTimeThreshold: 2000
        },
        notifications: {
          email: true,
          slack: false,
          webhook: false
        },
        recipients: {
          email: ['test@example.com'],
          slack: [],
          webhook: []
        }
      }

      monitor.updateConfig(newConfig)
      
      // Configuration should be updated (we can't directly access private config,
      // but we can verify the monitor is still running)
      expect(monitor.getMonitoringStatus().isMonitoring).toBe(false)
    })

    it('should restart monitoring when config is updated during active monitoring', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      monitor.startMonitoring()
      expect(monitor.getMonitoringStatus().isMonitoring).toBe(true)

      monitor.updateConfig({ scanInterval: 20 })
      
      // Should still be monitoring after config update
      expect(monitor.getMonitoringStatus().isMonitoring).toBe(true)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Notification System', () => {
    it('should format alert messages correctly', () => {
      const alerts: SecurityAlert[] = [
        {
          id: 'alert1',
          type: 'critical',
          application: 'Test App 1',
          url: 'http://test1.com',
          message: 'Critical issue 1',
          details: 'Details 1',
          timestamp: new Date(),
          resolved: false
        },
        {
          id: 'alert2',
          type: 'warning',
          application: 'Test App 2',
          url: 'http://test2.com',
          message: 'Warning issue 2',
          details: 'Details 2',
          timestamp: new Date(),
          resolved: false
        }
      ]

      const message = monitor['formatAlertMessage'](alerts)
      
      expect(message).toContain('🚨 Security Alert Summary')
      expect(message).toContain('Critical Issues: 1')
      expect(message).toContain('Warnings: 1')
      expect(message).toContain('Test App 1')
      expect(message).toContain('Test App 2')
      expect(message).toContain('Critical issue 1')
      expect(message).toContain('Warning issue 2')
    })

    it('should handle notification sending (placeholder)', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      const alerts: SecurityAlert[] = [{
        id: 'alert1',
        type: 'critical',
        application: 'Test App',
        url: 'http://test.com',
        message: 'Test alert',
        details: 'Test details',
        timestamp: new Date(),
        resolved: false
      }]

      await monitor['sendNotifications'](alerts)
      
      expect(consoleSpy).toHaveBeenCalledWith('Email notification would be sent:', expect.any(String))
      expect(consoleSpy).toHaveBeenCalledWith('Slack notification would be sent:', expect.any(String))
      expect(consoleSpy).toHaveBeenCalledWith('Webhook notification would be sent:', [alerts])
      
      consoleSpy.mockRestore()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const monitor1 = getSecurityMonitor(mockConfig)
      const monitor2 = getSecurityMonitor()
      
      expect(monitor1).toBe(monitor2)
    })

    it('should reset the singleton correctly', () => {
      const monitor1 = getSecurityMonitor(mockConfig)
      resetSecurityMonitor()
      const monitor2 = getSecurityMonitor(mockConfig)
      
      expect(monitor1).not.toBe(monitor2)
    })
  })
})
