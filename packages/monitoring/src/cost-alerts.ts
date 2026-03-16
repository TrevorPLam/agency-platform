/**
 * Cost Alert System
 * 
 * Manages budget alerts and notifications for cost monitoring.
 * Provides configurable thresholds and multiple notification channels.
 */

import type { BudgetAlert, NotificationChannel, CostMetrics, TenantId } from './types'

/**
 * Alert engine configuration
 */
interface AlertEngineConfig {
  /** Default alert check interval in hours */
  checkInterval: number
  /** Rate limiting for notifications (per hour) */
  notificationRateLimit: number
  /** Default notification channels */
  defaultChannels: NotificationChannel[]
  /** Alert cooldown period in hours */
  alertCooldown: number
}

/**
 * Cost alert engine class
 */
export class CostAlertEngine {
  private config: AlertEngineConfig
  private lastAlertTimes = new Map<string, Date>()

  constructor(config: Partial<AlertEngineConfig> = {}) {
    this.config = {
      checkInterval: 1, // 1 hour default
      notificationRateLimit: 10, // 10 notifications per hour
      defaultChannels: [
        { type: 'email', destination: 'admin@agency.com', enabled: true },
      ],
      alertCooldown: 4, // 4 hours cooldown
      ...config,
    }
  }

  /**
   * Checks all active alerts against current metrics
   * Mock implementation for now - will be integrated with actual database
   */
  async checkAlerts(metrics: CostMetrics[]): Promise<BudgetAlert[]> {
    try {
      // Mock implementation - in production, this would query the database
      const mockAlerts: BudgetAlert[] = [
        {
          id: 'alert-1',
          tenantId: metrics[0]?.tenantId || 'default-tenant',
          name: 'Storage Budget Alert',
          category: 'storage',
          threshold: 100 * 1024 * 1024, // 100MB
          current: metrics[0]?.storageUsage || 0,
          thresholdType: 'absolute',
          severity: 'medium',
          active: true,
          notificationChannels: this.config.defaultChannels,
          lastTriggered: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const triggeredAlerts: BudgetAlert[] = []

      for (const alertConfig of mockAlerts) {
        const triggered = await this.evaluateAlert(alertConfig, metrics)
        if (triggered) {
          triggeredAlerts.push(triggered)
        }
      }

      // Send notifications for triggered alerts
      for (const alert of triggeredAlerts) {
        await this.sendNotification(alert)
      }

      console.log('Alerts checked', {
        totalAlerts: mockAlerts.length,
        triggeredAlerts: triggeredAlerts.length,
      })

      return triggeredAlerts
    } catch (error) {
      console.error('Error checking alerts:', error)
      throw error
    }
  }

  /**
   * Evaluates a single alert against current metrics
   */
  private async evaluateAlert(
    alertConfig: BudgetAlert,
    metrics: CostMetrics[]
  ): Promise<BudgetAlert | null> {
    try {
      // Get relevant metrics for this alert's tenant and category
      const relevantMetrics = metrics.filter(m => 
        m.tenantId === alertConfig.tenantId
      )

      if (relevantMetrics.length === 0) {
        return null
      }

      // Get current value based on category
      const currentValue = this.getCurrentValue(alertConfig.category, relevantMetrics)
      
      // Check if alert should trigger
      const shouldTrigger = this.shouldTriggerAlert(
        currentValue,
        alertConfig.threshold,
        alertConfig.thresholdType
      )

      if (!shouldTrigger) {
        return null
      }

      // Check cooldown period
      const alertKey = `${alertConfig.id}-${alertConfig.category}`
      const lastAlert = this.lastAlertTimes.get(alertKey)
      const cooldownPeriod = this.config.alertCooldown * 60 * 60 * 1000 // Convert to milliseconds

      if (lastAlert && (Date.now() - lastAlert.getTime() < cooldownPeriod)) {
        return null // Still in cooldown
      }

      // Update last alert time
      this.lastAlertTimes.set(alertKey, new Date())

      // Return triggered alert
      return {
        ...alertConfig,
        current: currentValue,
        lastTriggered: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error evaluating alert:', error)
      return null
    }
  }

  /**
   * Gets current value for alert category from metrics
   */
  private getCurrentValue(category: string, metrics: CostMetrics[]): number {
    const latestMetric = metrics
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    switch (category) {
      case 'storage':
        return latestMetric?.storageUsage || 0
      case 'compute':
        return latestMetric?.cicdRuntime || 0
      case 'bandwidth':
        return latestMetric?.bandwidthUsage || 0
      case 'total':
        return latestMetric?.totalCost || 0
      default:
        return 0
    }
  }

  /**
   * Determines if alert should trigger based on threshold
   */
  private shouldTriggerAlert(
    current: number,
    threshold: number,
    thresholdType: string
  ): boolean {
    switch (thresholdType) {
      case 'absolute':
        return current >= threshold
      case 'percentage':
        // For percentage alerts, threshold is a percentage (e.g., 80 for 80%)
        // We need to compare against some baseline - for now, assume baseline is threshold * 1.25
        const baseline = threshold * 1.25
        const currentPercentage = (current / baseline) * 100
        return currentPercentage >= threshold
      case 'rate':
        // Rate alerts would compare against previous period
        // For now, treat as absolute
        return current >= threshold
      default:
        return false
    }
  }

  /**
   * Sends notification for triggered alert
   */
  private async sendNotification(alert: BudgetAlert): Promise<void> {
    try {
      const message = this.buildAlertMessage(alert)

      for (const channel of alert.notificationChannels) {
        if (!channel.enabled) continue

        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(channel.destination, message, alert)
            break
          case 'webhook':
            await this.sendWebhookNotification(channel.destination, message, alert)
            break
          case 'slack':
            await this.sendSlackNotification(channel.destination, message, alert)
            break
          case 'teams':
            await this.sendTeamsNotification(channel.destination, message, alert)
            break
        }
      }

      console.log('Alert notification sent', {
        alertId: alert.id,
        category: alert.category,
        severity: alert.severity,
        channels: alert.notificationChannels.filter(c => c.enabled).length,
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  /**
   * Builds alert message
   */
  private buildAlertMessage(alert: BudgetAlert): {
    subject: string
    body: string
    severity: string
    category: string
    current: number
    threshold: number
    tenantId: string
  } {
    const categoryNames = {
      storage: 'Storage Usage',
      compute: 'CI/CD Runtime',
      bandwidth: 'Bandwidth Usage',
      total: 'Total Cost',
    }

    const categoryName = categoryNames[alert.category as keyof typeof categoryNames]
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    }

    return {
      subject: `${severityEmoji[alert.severity]} Cost Alert: ${alert.name}`,
      body: `
Cost alert triggered for ${categoryName}:

Current Value: ${this.formatValue(alert.current, alert.category)}
Threshold: ${this.formatValue(alert.threshold, alert.category)}
Severity: ${alert.severity.toUpperCase()}
Tenant: ${alert.tenantId}

This alert was triggered at ${new Date(alert.lastTriggered!).toLocaleString()}.

Please review your cost management dashboard for more details.
      `.trim(),
      severity: alert.severity,
      category: categoryName,
      current: alert.current,
      threshold: alert.threshold,
      tenantId: alert.tenantId,
    }
  }

  /**
   * Formats value based on category
   */
  private formatValue(value: number, category: string): string {
    switch (category) {
      case 'storage':
        return this.formatBytes(value)
      case 'compute':
        return `${value.toFixed(1)} minutes`
      case 'bandwidth':
        return this.formatBytes(value)
      case 'total':
        return `$${value.toFixed(2)}`
      default:
        return value.toString()
    }
  }

  /**
   * Formats bytes in human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Sends email notification (placeholder implementation)
   */
  private async sendEmailNotification(
    destination: string,
    message: any,
    alert: BudgetAlert
  ): Promise<void> {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    console.log('Email notification sent to:', destination)
    console.log('Message:', message.subject)
    
    // For now, just log the notification
    // In production, you would use @agency/email package
  }

  /**
   * Sends webhook notification
   */
  private async sendWebhookNotification(
    destination: string,
    message: any,
    alert: BudgetAlert
  ): Promise<void> {
    try {
      const response = await fetch(destination, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: {
            id: alert.id,
            name: alert.name,
            category: alert.category,
            severity: alert.severity,
            current: alert.current,
            threshold: alert.threshold,
            tenantId: alert.tenantId,
            timestamp: alert.lastTriggered,
          },
          message,
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending webhook notification:', error)
      throw error
    }
  }

  /**
   * Sends Slack notification
   */
  private async sendSlackNotification(
    destination: string,
    message: any,
    alert: BudgetAlert
  ): Promise<void> {
    try {
      const slackMessage = {
        text: message.subject,
        attachments: [
          {
            color: this.getSeverityColor(alert.severity),
            fields: [
              {
                title: 'Category',
                value: message.category,
                short: true,
              },
              {
                title: 'Current Value',
                value: this.formatValue(alert.current, alert.category),
                short: true,
              },
              {
                title: 'Threshold',
                value: this.formatValue(alert.threshold, alert.category),
                short: true,
              },
              {
                title: 'Tenant',
                value: alert.tenantId,
                short: true,
              },
            ],
            text: message.body,
          },
        ],
      }

      const response = await fetch(destination, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      })

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error)
      throw error
    }
  }

  /**
   * Sends Teams notification
   */
  private async sendTeamsNotification(
    destination: string,
    message: any,
    alert: BudgetAlert
  ): Promise<void> {
    try {
      const teamsMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": this.getSeverityColor(alert.severity),
        "summary": message.subject,
        "sections": [
          {
            "activityTitle": message.subject,
            "activitySubtitle": `Tenant: ${alert.tenantId}`,
            "facts": [
              {
                "name": "Category",
                "value": message.category,
              },
              {
                "name": "Current Value",
                "value": this.formatValue(alert.current, alert.category),
              },
              {
                "name": "Threshold",
                "value": this.formatValue(alert.threshold, alert.category),
              },
              {
                "name": "Severity",
                "value": alert.severity.toUpperCase(),
              },
            ],
            "text": message.body,
          },
        ],
      }

      const response = await fetch(destination, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamsMessage),
      })

      if (!response.ok) {
        throw new Error(`Teams notification failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending Teams notification:', error)
      throw error
    }
  }

  /**
   * Gets color for severity level
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low':
        return 'FFFF00' // Yellow
      case 'medium':
        return 'FFA500' // Orange
      case 'high':
        return 'FF0000' // Red
      case 'critical':
        return '8B0000' // Dark Red
      default:
        return '808080' // Gray
    }
  }

  /**
   * Creates a new budget alert
   * Mock implementation for now
   */
  async createAlert(alert: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered'>): Promise<BudgetAlert> {
    try {
      const newAlert: BudgetAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log('Alert created', {
        alertId: newAlert.id,
        category: alert.category,
        threshold: alert.threshold,
        severity: alert.severity,
      })

      return newAlert
    } catch (error) {
      console.error('Error in createAlert:', error)
      throw error
    }
  }

  /**
   * Updates an existing alert
   * Mock implementation for now
   */
  async updateAlert(id: string, updates: Partial<BudgetAlert>): Promise<BudgetAlert> {
    try {
      const updatedAlert: BudgetAlert = {
        id,
        tenantId: 'default-tenant',
        name: 'Updated Alert',
        category: 'total',
        threshold: 100,
        current: 0,
        thresholdType: 'absolute',
        severity: 'medium',
        active: true,
        notificationChannels: this.config.defaultChannels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates,
      }

      console.log('Alert updated', {
        alertId: id,
        updates: Object.keys(updates),
      })

      return updatedAlert
    } catch (error) {
      console.error('Error in updateAlert:', error)
      throw error
    }
  }

  /**
   * Deletes an alert
   * Mock implementation for now
   */
  async deleteAlert(id: string): Promise<void> {
    try {
      console.log('Alert deleted', { alertId: id })
    } catch (error) {
      console.error('Error in deleteAlert:', error)
      throw error
    }
  }
}
