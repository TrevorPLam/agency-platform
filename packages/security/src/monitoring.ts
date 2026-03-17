/**
 * Security Monitoring and Alerting System
 * 
 * Provides real-time monitoring, alerting, and trend analysis for security headers
 */

import { validateSecurityHeaders } from '@agency/security/header-validator'
import { validateCSP } from '@agency/security/csp-validator'

export interface SecurityAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  application: string
  url: string
  message: string
  details: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface SecurityTrend {
  application: string
  date: string
  score: number
  grade: string
  criticalIssues: number
  headersPresent: number
  headersValid: number
}

export interface SecurityMetrics {
  overallScore: number
  criticalIssues: number
  applicationsScanned: number
  totalApplications: number
  averageResponseTime: number
  lastScanTime: Date
  trends: SecurityTrend[]
  alerts: SecurityAlert[]
}

export interface MonitoringConfig {
  scanInterval: number // minutes
  alertThresholds: {
    criticalScoreDrop: number // percentage
    criticalIssueCount: number
    responseTimeThreshold: number // milliseconds
  }
  notifications: {
    email: boolean
    slack: boolean
    webhook: boolean
  }
  recipients: {
    email: string[]
    slack: string[]
    webhook: string[]
  }
}

/**
 * Security Monitor Class
 */
export class SecurityMonitor {
  private config: MonitoringConfig
  private alerts: SecurityAlert[] = []
  private trends: SecurityTrend[] = []
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout

  constructor(config: MonitoringConfig) {
    this.config = config
    this.loadHistoricalData()
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring is already running')
      return
    }

    this.isMonitoring = true
    console.log('Starting security monitoring...')

    // Initial scan
    this.performSecurityScan()

    // Set up interval scanning
    this.monitoringInterval = setInterval(() => {
      this.performSecurityScan()
    }, this.config.scanInterval * 60 * 1000) // Convert minutes to milliseconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Security monitoring is not running')
      return
    }

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    console.log('Security monitoring stopped')
  }

  /**
   * Perform security scan on all applications
   */
  private async performSecurityScan(): Promise<void> {
    const applications = [
      { name: 'Agency Admin', url: 'http://localhost:3001' },
      { name: 'Firm', url: 'http://localhost:3000' },
      { name: 'Riley Day Care', url: 'http://localhost:3002' },
      { name: 'The Barber Cave', url: 'http://localhost:3003' }
    ]

    const scanResults: SecurityTrend[] = []
    const startTime = Date.now()

    for (const app of applications) {
      try {
        const response = await fetch(app.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Agency-Security-Monitor/1.0'
          }
        })

        if (!response.ok) {
          this.createAlert({
            type: 'critical',
            application: app.name,
            url: app.url,
            message: 'Application unavailable',
            details: `Failed to scan ${app.name}: ${response.statusText}`,
            timestamp: new Date()
          })
          continue
        }

        const responseTime = Date.now() - startTime
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        // Validate security headers
        const validation = validateSecurityHeaders(app.url, headers)
        
        // Check for critical issues
        if (validation.criticalIssues.length > 0) {
          validation.criticalIssues.forEach(issue => {
            this.createAlert({
              type: 'critical',
              application: app.name,
              url: app.url,
              message: 'Critical security issue detected',
              details: issue,
              timestamp: new Date()
            })
          })
        }

        // Check for score drop
        const currentScore = Math.round((validation.overallScore / validation.maxScore) * 100)
        const previousTrend = this.getPreviousTrend(app.name)
        
        if (previousTrend) {
          const scoreDrop = previousTrend.score - currentScore
          if (scoreDrop >= this.config.alertThresholds.criticalScoreDrop) {
            this.createAlert({
              type: 'warning',
              application: app.name,
              url: app.url,
              message: 'Security score dropped significantly',
              details: `Score dropped from ${previousTrend.score}% to ${currentScore}% (${scoreDrop}% drop)`,
              timestamp: new Date()
            })
          }
        }

        // Check response time
        if (responseTime >= this.config.alertThresholds.responseTimeThreshold) {
          this.createAlert({
            type: 'warning',
            application: app.name,
            url: app.url,
            message: 'High response time detected',
            details: `Response time: ${responseTime}ms (threshold: ${this.config.alertThresholds.responseTimeThreshold}ms)`,
            timestamp: new Date()
          })
        }

        // Record trend data
        const trend: SecurityTrend = {
          application: app.name,
          date: new Date().toISOString().split('T')[0],
          score: currentScore,
          grade: validation.grade,
          criticalIssues: validation.criticalIssues.length,
          headersPresent: validation.results.filter(r => r.present).length,
          headersValid: validation.results.filter(r => r.valid).length
        }

        scanResults.push(trend)

      } catch (error) {
        this.createAlert({
          type: 'critical',
          application: app.name,
          url: app.url,
          message: 'Scan failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        })
      }
    }

    // Store trends
    this.trends.push(...scanResults)
    this.saveHistoricalData()

    // Send notifications if there are critical alerts
    const criticalAlerts = this.alerts.filter(alert => alert.type === 'critical' && !alert.resolved)
    if (criticalAlerts.length > 0) {
      await this.sendNotifications(criticalAlerts)
    }

    console.log(`Security scan completed. ${scanResults.length} applications scanned.`)
  }

  /**
   * Create a security alert
   */
  private createAlert(alert: Omit<SecurityAlert, 'id' | 'resolved'>): void {
    const newAlert: SecurityAlert = {
      ...alert,
      id: this.generateAlertId(),
      resolved: false
    }

    this.alerts.push(newAlert)
    console.log(`Security alert created: ${newAlert.message} for ${newAlert.application}`)
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get previous trend data for comparison
   */
  private getPreviousTrend(application: string): SecurityTrend | null {
    const appTrends = this.trends.filter(t => t.application === application)
    if (appTrends.length === 0) return null
    
    // Return the most recent trend
    return appTrends[appTrends.length - 1]
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: SecurityAlert[]): Promise<void> {
    const message = this.formatAlertMessage(alerts)

    if (this.config.notifications.email && this.config.recipients.email.length > 0) {
      await this.sendEmailNotification(message)
    }

    if (this.config.notifications.slack && this.config.recipients.slack.length > 0) {
      await this.sendSlackNotification(message)
    }

    if (this.config.notifications.webhook && this.config.recipients.webhook.length > 0) {
      await this.sendWebhookNotification(alerts)
    }
  }

  /**
   * Format alert message for notifications
   */
  private formatAlertMessage(alerts: SecurityAlert[]): string {
    const criticalCount = alerts.filter(a => a.type === 'critical').length
    const warningCount = alerts.filter(a => a.type === 'warning').length

    let message = `🚨 Security Alert Summary\n\n`
    message += `Critical Issues: ${criticalCount}\n`
    message += `Warnings: ${warningCount}\n\n`

    alerts.forEach(alert => {
      message += `**${alert.application}** (${alert.type.toUpperCase()})\n`
      message += `${alert.message}\n`
      message += `${alert.details}\n\n`
    })

    message += `Timestamp: ${new Date().toISOString()}\n`
    message += `Action: Review security dashboard immediately`

    return message
  }

  /**
   * Send email notification (placeholder implementation)
   */
  private async sendEmailNotification(message: string): Promise<void> {
    console.log('Email notification would be sent:', message)
    // TODO: Implement actual email sending logic
  }

  /**
   * Send Slack notification (placeholder implementation)
   */
  private async sendSlackNotification(message: string): Promise<void> {
    console.log('Slack notification would be sent:', message)
    // TODO: Implement actual Slack webhook logic
  }

  /**
   * Send webhook notification (placeholder implementation)
   */
  private async sendWebhookNotification(alerts: SecurityAlert[]): Promise<void> {
    console.log('Webhook notification would be sent:', alerts)
    // TODO: Implement actual webhook logic
  }

  /**
   * Get current security metrics
   */
  getMetrics(): SecurityMetrics {
    const recentTrends = this.trends.filter(t => 
      new Date(t.date).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    )

    const overallScore = recentTrends.length > 0
      ? Math.round(recentTrends.reduce((sum, t) => sum + t.score, 0) / recentTrends.length)
      : 0

    const criticalIssues = this.alerts.filter(a => a.type === 'critical' && !a.resolved).length

    return {
      overallScore,
      criticalIssues,
      applicationsScanned: recentTrends.length,
      totalApplications: 4,
      averageResponseTime: 0, // TODO: Calculate from scan data
      lastScanTime: new Date(),
      trends: recentTrends,
      alerts: this.alerts.filter(a => !a.resolved)
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      alert.resolvedBy = resolvedBy
      console.log(`Alert resolved: ${alert.message} by ${resolvedBy}`)
    }
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): SecurityAlert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Get security trends for an application
   */
  getApplicationTrends(application: string, days: number = 7): SecurityTrend[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return this.trends.filter(t => 
      t.application === application && 
      new Date(t.date).getTime() >= cutoffDate.getTime()
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  /**
   * Load historical data from storage
   */
  private loadHistoricalData(): void {
    // TODO: Implement actual data persistence
    // For now, start with empty arrays
    this.trends = []
    this.alerts = []
  }

  /**
   * Save historical data to storage
   */
  private saveHistoricalData(): void {
    // TODO: Implement actual data persistence
    // For now, just log that data would be saved
    console.log('Historical data saved (placeholder implementation)')
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { isMonitoring: boolean; uptime?: number } {
    return {
      isMonitoring: this.isMonitoring,
      uptime: this.monitoringInterval ? Date.now() : undefined
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart monitoring if it's running
    if (this.isMonitoring) {
      this.stopMonitoring()
      this.startMonitoring()
    }
  }
}

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: MonitoringConfig = {
  scanInterval: 15, // 15 minutes
  alertThresholds: {
    criticalScoreDrop: 20, // 20% drop
    criticalIssueCount: 1,
    responseTimeThreshold: 5000 // 5 seconds
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

/**
 * Singleton instance for global monitoring
 */
let securityMonitorInstance: SecurityMonitor | null = null

export function getSecurityMonitor(config?: MonitoringConfig): SecurityMonitor {
  if (!securityMonitorInstance) {
    securityMonitorInstance = new SecurityMonitor(config || defaultMonitoringConfig)
  }
  return securityMonitorInstance
}

export function resetSecurityMonitor(): void {
  if (securityMonitorInstance) {
    securityMonitorInstance.stopMonitoring()
    securityMonitorInstance = null
  }
}
