/**
 * Performance alerting system
 * 
 * Monitors Core Web Vitals data and triggers alerts for performance regressions
 * Integrates with notification systems and provides escalation policies
 */

import type { TenantId } from '@agency/database'
import type { PerformanceAlert, WebVitalsMetrics, PerformanceBudget } from './types'

/**
 * Alert severity levels and escalation policies
 */
export const ALERT_ESCALATION_POLICIES = {
  low: {
    threshold: 1, // Trigger after 1 violation
    cooldown: 3600000, // 1 hour cooldown
    channels: ['webhook'],
  },
  medium: {
    threshold: 3, // Trigger after 3 violations
    cooldown: 1800000, // 30 minute cooldown
    channels: ['webhook', 'email'],
  },
  high: {
    threshold: 5, // Trigger after 5 violations
    cooldown: 900000, // 15 minute cooldown
    channels: ['webhook', 'email', 'slack'],
  },
  critical: {
    threshold: 1, // Trigger immediately
    cooldown: 300000, // 5 minute cooldown
    channels: ['webhook', 'email', 'slack', 'sms'],
  },
} as const

/**
 * Performance alert engine
 */
export class PerformanceAlertEngine {
  private activeAlerts: Map<string, PerformanceAlert> = new Map()
  private alertHistory: Map<string, number[]> = new Map()
  private lastAlertTimes: Map<string, number> = new Map()

  constructor(private config: {
    notificationWebhook?: string
    emailSettings?: {
      smtpHost: string
      smtpPort: number
      smtpUser: string
      smtpPass: string
      fromEmail: string
      adminEmails: string[]
    }
    slackSettings?: {
      webhookUrl: string
      channel: string
    }
  }) {}

  /**
   * Process Web Vitals metrics and check for alert conditions
   */
  async processMetrics(metrics: WebVitalsMetrics[], budgets: PerformanceBudget[]): Promise<PerformanceAlert[]> {
    const triggeredAlerts: PerformanceAlert[] = []

    for (const metric of metrics) {
      const metricAlerts = await this.checkMetricAgainstBudgets(metric, budgets)
      triggeredAlerts.push(...metricAlerts)
    }

    return triggeredAlerts
  }

  /**
   * Check a single metric against all applicable budgets
   */
  private async checkMetricAgainstBudgets(
    metric: WebVitalsMetrics,
    budgets: PerformanceBudget[]
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = []

    for (const budget of budgets) {
      if (!budget.active || budget.tenantId !== metric.tenantId) continue

      let metricValue: number
      switch (budget.category) {
        case 'lcp': metricValue = metric.lcp; break
        case 'inp': metricValue = metric.inp; break
        case 'cls': metricValue = metric.cls; break
        case 'fcp': metricValue = metric.fcp; break
        case 'ttfb': metricValue = metric.ttfb; break
        default: continue
      }

      const isViolation = budget.type === 'maximum' ? metricValue > budget.threshold : metricValue < budget.threshold

      if (isViolation) {
        const alert = await this.createOrUpdateAlert(budget, metricValue, metric)
        if (alert) {
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  /**
   * Create or update an alert
   */
  private async createOrUpdateAlert(
    budget: PerformanceBudget,
    currentValue: number,
    metric: WebVitalsMetrics
  ): Promise<PerformanceAlert | null> {
    const alertKey = `${budget.id}-${budget.category}`
    const now = Date.now()

    // Check cooldown period
    const lastAlertTime = this.lastAlertTimes.get(alertKey) || 0
    const cooldown = ALERT_ESCALATION_POLICIES[budget.alertSeverity].cooldown
    
    if (now - lastAlertTime < cooldown) {
      return null // Still in cooldown period
    }

    let alert = this.activeAlerts.get(alertKey)

    if (!alert) {
      // Create new alert
      alert = {
        id: this.generateId(),
        tenantId: budget.tenantId,
        name: `Performance Alert: ${budget.name}`,
        metric: budget.category,
        threshold: budget.threshold,
        currentValue,
        thresholdType: 'absolute',
        severity: budget.alertSeverity,
        active: true,
        violationCount: 1,
        lastTriggered: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.activeAlerts.set(alertKey, alert)
      this.alertHistory.set(alertKey, [now])
    } else {
      // Update existing alert
      alert.violationCount++
      alert.currentValue = currentValue
      alert.lastTriggered = new Date().toISOString()
      alert.updatedAt = new Date().toISOString()

      const history = this.alertHistory.get(alertKey) || []
      history.push(now)
      this.alertHistory.set(alertKey, history)
    }

    // Check if alert should be triggered based on escalation policy
    const policy = ALERT_ESCALATION_POLICIES[budget.alertSeverity]
    const violationCount = alert.violationCount

    if (violationCount >= policy.threshold) {
      this.lastAlertTimes.set(alertKey, now)
      await this.triggerAlert(alert, metric, policy.channels)
      return alert
    }

    return null
  }

  /**
   * Trigger alert notifications
   */
  private async triggerAlert(
    alert: PerformanceAlert,
    metric: WebVitalsMetrics,
    channels: string[]
  ): Promise<void> {
    const alertData = {
      alert: {
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
        metric: alert.metric,
        threshold: alert.threshold,
        currentValue: alert.currentValue,
        violationCount: alert.violationCount,
        lastTriggered: alert.lastTriggered,
      },
      metric: {
        pageUrl: metric.pageUrl,
        deviceCategory: metric.deviceCategory,
        connectionType: metric.connectionType,
        rating: metric.rating,
        timestamp: metric.timestamp,
      },
      tenant: metric.tenantId,
    }

    // Send notifications through configured channels
    const promises = channels.map(channel => this.sendNotification(channel, alertData))
    await Promise.allSettled(promises)
  }

  /**
   * Send notification through specific channel
   */
  private async sendNotification(channel: string, alertData: any): Promise<void> {
    try {
      switch (channel) {
        case 'webhook':
          await this.sendWebhookNotification(alertData)
          break
        case 'email':
          await this.sendEmailNotification(alertData)
          break
        case 'slack':
          await this.sendSlackNotification(alertData)
          break
        case 'sms':
          await this.sendSMSNotification(alertData)
          break
        default:
          console.warn(`Unknown notification channel: ${channel}`)
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error)
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alertData: any): Promise<void> {
    if (!this.config.notificationWebhook) return

    const response = await fetch(this.config.notificationWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    })

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`)
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alertData: any): Promise<void> {
    if (!this.config.emailSettings) return

    const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, adminEmails } = this.config.emailSettings
    
    const subject = `🚨 Performance Alert: ${alertData.alert.name}`
    const body = this.generateEmailBody(alertData)

    // In a real implementation, you would use a library like nodemailer
    console.log('Email notification:', { subject, to: adminEmails, body })
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alertData: any): Promise<void> {
    if (!this.config.slackSettings) return

    const { webhookUrl, channel } = this.config.slackSettings
    const payload = {
      channel,
      text: `🚨 Performance Alert: ${alertData.alert.name}`,
      attachments: [
        {
          color: alertData.alert.severity === 'critical' ? 'danger' : 
                 alertData.alert.severity === 'high' ? 'warning' : 'good',
          fields: [
            { title: 'Metric', value: alertData.alert.metric.toUpperCase(), short: true },
            { title: 'Current Value', value: alertData.alert.currentValue.toString(), short: true },
            { title: 'Threshold', value: alertData.alert.threshold.toString(), short: true },
            { title: 'Page', value: alertData.metric.pageUrl, short: false },
            { title: 'Device', value: alertData.metric.deviceCategory, short: true },
            { title: 'Violations', value: alertData.alert.violationCount.toString(), short: true },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }
  }

  /**
   * Send SMS notification (for critical alerts only)
   */
  private async sendSMSNotification(alertData: any): Promise<void> {
    // In a real implementation, you would use a service like Twilio
    console.log('SMS notification for critical alert:', alertData.alert.name)
  }

  /**
   * Generate email body for alert notifications
   */
  private generateEmailBody(alertData: any): string {
    const { alert, metric } = alertData

    return `
Performance Alert Triggered

Alert Details:
- Name: ${alert.name}
- Severity: ${alert.severity}
- Metric: ${alert.metric.toUpperCase()}
- Current Value: ${alert.currentValue}
- Threshold: ${alert.threshold}
- Violations: ${alert.violationCount}
- Last Triggered: ${alert.lastTriggered}

Metric Context:
- Page URL: ${metric.pageUrl}
- Device Category: ${metric.deviceCategory}
- Connection Type: ${metric.connectionType}
- Performance Rating: ${metric.rating}
- Timestamp: ${metric.timestamp}

This is an automated alert from the Agency Platform Performance Monitoring System.
    `.trim()
  }

  /**
   * Get active alerts for a tenant
   */
  getActiveAlerts(tenantId?: TenantId): PerformanceAlert[] {
    const alerts = Array.from(this.activeAlerts.values())
    
    if (tenantId) {
      return alerts.filter(alert => alert.tenantId === tenantId)
    }
    
    return alerts
  }

  /**
   * Clear alerts for a tenant or specific alert
   */
  clearAlerts(tenantId?: TenantId, alertId?: string): void {
    if (alertId) {
      // Clear specific alert
      const alert = this.activeAlerts.get(alertId)
      if (alert) {
        this.activeAlerts.delete(alertId)
        this.alertHistory.delete(alertId)
        this.lastAlertTimes.delete(alertId)
      }
    } else if (tenantId) {
      // Clear all alerts for tenant
      for (const [key, alert] of this.activeAlerts.entries()) {
        if (alert.tenantId === tenantId) {
          this.activeAlerts.delete(key)
          this.alertHistory.delete(key)
          this.lastAlertTimes.delete(key)
        }
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number
    bySeverity: Record<string, number>
    byTenant: Record<string, number>
    recent: PerformanceAlert[]
  } {
    const alerts = Array.from(this.activeAlerts.values())
    
    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byTenant = alerts.reduce((acc, alert) => {
      const tenantKey = alert.tenantId.toString()
      acc[tenantKey] = (acc[tenantKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recent = alerts
      .filter(alert => alert.lastTriggered)
      .sort((a, b) => new Date(b.lastTriggered!).getTime() - new Date(a.lastTriggered!).getTime())
      .slice(0, 10)

    return {
      total: alerts.length,
      bySeverity,
      byTenant,
      recent,
    }
  }
}

/**
 * Create performance alert engine instance
 */
export function createPerformanceAlertEngine(config: {
  notificationWebhook?: string
  emailSettings?: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    fromEmail: string
    adminEmails: string[]
  }
  slackSettings?: {
    webhookUrl: string
    channel: string
  }
}): PerformanceAlertEngine {
  return new PerformanceAlertEngine(config)
}
