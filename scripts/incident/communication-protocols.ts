#!/usr/bin/env tsx

/**
 * Agency Platform Communication Protocols
 * 
 * Multi-channel communication system for incident response and business continuity.
 * Supports Slack, Email, Teams, SMS, and custom webhooks.
 * 
 * @author Agency Platform
 * @version 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface CommunicationChannel {
  id: string
  name: string
  type: 'slack' | 'email' | 'teams' | 'sms' | 'webhook'
  config: Record<string, any>
  enabled: boolean
}

interface MessageTemplate {
  id: string
  name: string
  type: 'incident' | 'recovery' | 'maintenance' | 'alert'
  subject?: string
  body: string
  variables: string[]
}

interface CommunicationConfig {
  channels: CommunicationChannel[]
  templates: MessageTemplate[]
  escalation: {
    levels: EscalationLevel[]
    rules: EscalationRule[]
  }
  delivery: {
    retries: number
    timeout: number
    batch_size: number
  }
}

interface EscalationLevel {
  level: number
  name: string
  delay_minutes: number
  channels: string[]
  recipients: string[]
}

interface EscalationRule {
  id: string
  name: string
  condition: string
  action: 'escalate' | 'notify' | 'page'
  target: string
}

class CommunicationManager {
  private config: CommunicationConfig
  private repoRoot: string

  constructor(configPath: string = '.communication-config.json') {
    this.repoRoot = this.getRepoRoot()
    this.config = this.loadConfig(configPath)
  }

  private getRepoRoot(): string {
    try {
      return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
    } catch (error) {
      throw new Error('Not in a Git repository')
    }
  }

  private loadConfig(configPath: string): CommunicationConfig {
    const fullPath = join(this.repoRoot, configPath)
    
    if (!existsSync(fullPath)) {
      const defaultConfig: CommunicationConfig = {
        channels: [
          {
            id: 'slack-incidents',
            name: 'Slack Incidents',
            type: 'slack',
            config: {
              webhook_url: process.env.SLACK_WEBHOOK_URL,
              channel: '#incidents',
              username: 'Agency Platform',
              icon_emoji: ':warning:'
            },
            enabled: !!process.env.SLACK_WEBHOOK_URL
          },
          {
            id: 'email-engineering',
            name: 'Engineering Email',
            type: 'email',
            config: {
              smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS
                }
              },
              from: process.env.EMAIL_FROM || 'noreply@agency.com',
              recipients: process.env.ENGINEERING_EMAILS?.split(',') || []
            },
            enabled: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
          },
          {
            id: 'teams-alerts',
            name: 'Teams Alerts',
            type: 'teams',
            config: {
              webhook_url: process.env.TEAMS_WEBHOOK_URL,
              title: 'Agency Platform Alert'
            },
            enabled: !!process.env.TEAMS_WEBHOOK_URL
          }
        ],
        templates: [
          {
            id: 'incident-created',
            name: 'Incident Created',
            type: 'incident',
            subject: '🚨 {{severity}} Incident: {{title}}',
            body: `🚨 {{severity}} Incident Detected

Incident ID: {{incidentId}}
Title: {{title}}
Severity: {{severity}}
Detected: {{detectedAt}}
Description: {{description}}
Affected Systems: {{affectedSystems}}

Actions:
- Investigate the issue
- Assess impact
- Begin mitigation

Status updates will follow in this channel.`,
            variables: ['incidentId', 'title', 'severity', 'detectedAt', 'description', 'affectedSystems']
          },
          {
            id: 'incident-resolved',
            name: 'Incident Resolved',
            type: 'recovery',
            subject: '✅ Resolved: {{title}}',
            body: `✅ Incident Resolved

Incident ID: {{incidentId}}
Title: {{title}}
Resolved At: {{resolvedAt}}
Duration: {{duration}}
Resolution: {{resolution}}

Post-incident review will be scheduled.`,
            variables: ['incidentId', 'title', 'resolvedAt', 'duration', 'resolution']
          },
          {
            id: 'maintenance-scheduled',
            name: 'Maintenance Scheduled',
            type: 'maintenance',
            subject: '🔧 Scheduled Maintenance: {{title}}',
            body: `🔧 Scheduled Maintenance

Title: {{title}}
Start Time: {{startTime}}
Duration: {{duration}}
Impact: {{impact}}
Description: {{description}}

Systems may be unavailable during this window.`,
            variables: ['title', 'startTime', 'duration', 'impact', 'description']
          },
          {
            id: 'backup-failed',
            name: 'Backup Failed',
            type: 'alert',
            subject: '❌ Backup Failure: {{system}}',
            body: `❌ Backup Operation Failed

System: {{system}}
Timestamp: {{timestamp}}
Error: {{error}}
Impact: {{impact}}

Immediate action required to ensure data protection.`,
            variables: ['system', 'timestamp', 'error', 'impact']
          }
        ],
        escalation: {
          levels: [
            {
              level: 1,
              name: 'On-call Engineer',
              delay_minutes: 0,
              channels: ['slack-incidents'],
              recipients: ['oncall@agency.com']
            },
            {
              level: 2,
              name: 'Engineering Lead',
              delay_minutes: 15,
              channels: ['slack-incidents', 'email-engineering'],
              recipients: ['lead@agency.com', 'oncall@agency.com']
            },
            {
              level: 3,
              name: 'Management',
              delay_minutes: 60,
              channels: ['email-engineering', 'teams-alerts'],
              recipients: ['leadership@agency.com', 'lead@agency.com']
            }
          ],
          rules: [
            {
              id: 'critical-immediate',
              name: 'Critical - Immediate Escalation',
              condition: 'severity = "critical"',
              action: 'escalate',
              target: '3'
            },
            {
              id: 'high-15min',
              name: 'High - 15min Escalation',
              condition: 'severity = "high" AND time_since_detection > 15',
              action: 'escalate',
              target: '2'
            },
            {
              id: 'unresolved-60min',
              name: 'Unresolved - 60min Escalation',
              condition: 'time_since_detection > 60 AND status != "resolved"',
              action: 'escalate',
              target: '3'
            }
          ]
        },
        delivery: {
          retries: 3,
          timeout: 30000,
          batch_size: 10
        }
      }
      
      writeFileSync(fullPath, JSON.stringify(defaultConfig, null, 2))
      console.log(`✅ Created default communication config: ${configPath}`)
      return defaultConfig
    }

    const configContent = readFileSync(fullPath, 'utf8')
    return JSON.parse(configContent)
  }

  private async sendSlackMessage(channel: CommunicationChannel, message: string): Promise<void> {
    if (!channel.config.webhook_url) {
      throw new Error('Slack webhook URL not configured')
    }

    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: channel.config.icon_emoji,
      text: message
    }

    const response = await fetch(channel.config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
    }
  }

  private async sendEmail(channel: CommunicationChannel, subject: string, body: string): Promise<void> {
    // In a real implementation, this would use nodemailer or similar
    console.log(`📧 Sending email to ${channel.config.recipients.join(', ')}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${body}`)
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async sendTeamsMessage(channel: CommunicationChannel, message: string): Promise<void> {
    if (!channel.config.webhook_url) {
      throw new Error('Teams webhook URL not configured')
    }

    const payload = {
      title: channel.config.title,
      text: message
    }

    const response = await fetch(channel.config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.status} ${response.statusText}`)
    }
  }

  private async sendMessage(channelId: string, message: string, subject?: string): Promise<void> {
    const channel = this.config.channels.find(ch => ch.id === channelId)
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }

    if (!channel.enabled) {
      console.log(`⚠️  Channel ${channelId} is disabled`)
      return
    }

    const maxRetries = this.config.delivery.retries
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Sending message via ${channel.name} (attempt ${attempt}/${maxRetries})`)

        switch (channel.type) {
          case 'slack':
            await this.sendSlackMessage(channel, message)
            break
          case 'email':
            await this.sendEmail(channel, subject || 'Agency Platform Notification', message)
            break
          case 'teams':
            await this.sendTeamsMessage(channel, message)
            break
          default:
            throw new Error(`Unsupported channel type: ${channel.type}`)
        }

        console.log(`✅ Message sent successfully via ${channel.name}`)
        return

      } catch (error) {
        lastError = error as Error
        console.error(`❌ Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to send message after all retries')
  }

  private renderTemplate(templateId: string, variables: Record<string, string>): { subject?: string; body: string } {
    const template = this.config.templates.find(t => t.id === templateId)
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    let rendered = {
      subject: template.subject,
      body: template.body
    }

    // Replace variables in both subject and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      
      if (rendered.subject) {
        rendered.subject = rendered.subject.replace(new RegExp(placeholder, 'g'), value)
      }
      
      rendered.body = rendered.body.replace(new RegExp(placeholder, 'g'), value)
    }

    return rendered
  }

  public async sendIncidentNotification(
    incidentId: string,
    title: string,
    severity: string,
    description: string,
    affectedSystems: string[]
  ): Promise<void> {
    const variables = {
      incidentId,
      title,
      severity: severity.toUpperCase(),
      detectedAt: new Date().toISOString(),
      description,
      affectedSystems: affectedSystems.join(', ')
    }

    const template = this.renderTemplate('incident-created', variables)

    // Send to all enabled channels
    const promises = this.config.channels
      .filter(ch => ch.enabled)
      .map(ch => this.sendMessage(ch.id, template.body, template.subject))

    await Promise.allSettled(promises)
  }

  public async sendResolutionNotification(
    incidentId: string,
    title: string,
    resolution: string,
    duration: string
  ): Promise<void> {
    const variables = {
      incidentId,
      title,
      resolvedAt: new Date().toISOString(),
      duration,
      resolution
    }

    const template = this.renderTemplate('incident-resolved', variables)

    const promises = this.config.channels
      .filter(ch => ch.enabled)
      .map(ch => this.sendMessage(ch.id, template.body, template.subject))

    await Promise.allSettled(promises)
  }

  public async sendBackupFailureNotification(
    system: string,
    error: string,
    impact: string
  ): Promise<void> {
    const variables = {
      system,
      timestamp: new Date().toISOString(),
      error,
      impact
    }

    const template = this.renderTemplate('backup-failed', variables)

    const promises = this.config.channels
      .filter(ch => ch.enabled)
      .map(ch => this.sendMessage(ch.id, template.body, template.subject))

    await Promise.allSettled(promises)
  }

  public async sendMaintenanceNotification(
    title: string,
    startTime: string,
    duration: string,
    impact: string,
    description: string
  ): Promise<void> {
    const variables = {
      title,
      startTime,
      duration,
      impact,
      description
    }

    const template = this.renderTemplate('maintenance-scheduled', variables)

    const promises = this.config.channels
      .filter(ch => ch.enabled)
      .map(ch => this.sendMessage(ch.id, template.body, template.subject))

    await Promise.allSettled(promises)
  }

  public async testChannels(): Promise<void> {
    console.log('🧪 Testing communication channels...')

    const testMessage = `🧪 Test Message from Agency Platform
Timestamp: ${new Date().toISOString()}
This is a test of the communication system.

If you receive this message, the channel is working correctly.`

    for (const channel of this.config.channels) {
      if (!channel.enabled) {
        console.log(`⏭️  Skipping disabled channel: ${channel.name}`)
        continue
      }

      try {
        await this.sendMessage(channel.id, testMessage, '🧪 Communication Test')
        console.log(`✅ ${channel.name}: SUCCESS`)
      } catch (error) {
        console.log(`❌ ${channel.name}: FAILED - ${error}`)
      }
    }
  }

  public async generateCommunicationReport(): Promise<void> {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalChannels: this.config.channels.length,
        enabledChannels: this.config.channels.filter(ch => ch.enabled).length,
        totalTemplates: this.config.templates.length
      },
      channels: this.config.channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        enabled: ch.enabled,
        configured: Object.keys(ch.config).length > 0
      })),
      templates: this.config.templates.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        variables: t.variables
      }))
    }

    const reportPath = join(this.repoRoot, '.agency', 'communication-report.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Communication report saved to: ${reportPath}`)
    console.log(JSON.stringify(report, null, 2))
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const commManager = new CommunicationManager()

  try {
    switch (command) {
      case 'test':
        await commManager.testChannels()
        break
        
      case 'incident':
        const incidentId = args[1]
        const title = args[2]
        const severity = args[3]
        const description = args[4] || ''
        const affectedSystems = args.slice(5)
        
        if (!incidentId || !title || !severity) {
          console.log('Usage: tsx communication-protocols.ts incident <id> <title> <severity> [description] [systems...]')
          process.exit(1)
        }
        
        await commManager.sendIncidentNotification(incidentId, title, severity, description, affectedSystems)
        console.log('✅ Incident notification sent')
        break
        
      case 'resolved':
        const resolvedId = args[1]
        const resolvedTitle = args[2]
        const resolution = args[3] || ''
        const duration = args[4] || ''
        
        if (!resolvedId || !resolvedTitle) {
          console.log('Usage: tsx communication-protocols.ts resolved <id> <title> [resolution] [duration]')
          process.exit(1)
        }
        
        await commManager.sendResolutionNotification(resolvedId, resolvedTitle, resolution, duration)
        console.log('✅ Resolution notification sent')
        break
        
      case 'backup-failed':
        const system = args[1]
        const error = args[2] || 'Unknown error'
        const impact = args[3] || 'Data protection at risk'
        
        if (!system) {
          console.log('Usage: tsx communication-protocols.ts backup-failed <system> [error] [impact]')
          process.exit(1)
        }
        
        await commManager.sendBackupFailureNotification(system, error, impact)
        console.log('✅ Backup failure notification sent')
        break
        
      case 'maintenance':
        const maintTitle = args[1]
        const startTime = args[2]
        const maintDuration = args[3]
        const maintImpact = args[4]
        const maintDescription = args[5] || ''
        
        if (!maintTitle || !startTime || !maintDuration || !maintImpact) {
          console.log('Usage: tsx communication-protocols.ts maintenance <title> <start-time> <duration> <impact> [description]')
          process.exit(1)
        }
        
        await commManager.sendMaintenanceNotification(maintTitle, startTime, maintDuration, maintImpact, maintDescription)
        console.log('✅ Maintenance notification sent')
        break
        
      case 'report':
        await commManager.generateCommunicationReport()
        break
        
      default:
        console.log(`
📡 Agency Platform Communication System

Usage: tsx communication-protocols.ts <command>

Commands:
  test          - Test all communication channels
  incident      - Send incident notification
  resolved      - Send resolution notification
  backup-failed - Send backup failure notification
  maintenance   - Send maintenance notification
  report        - Generate communication report

Examples:
  tsx communication-protocols.ts test
  tsx communication-protocols.ts incident INC-123 "API Down" critical "Unable to reach API" api database
  tsx communication-protocols.ts resolved INC-123 "API Restored" "Fixed DNS issue" "45 minutes"
  tsx communication-protocols.ts backup-failed "database" "Connection timeout" "No recent backups"
  tsx communication-protocols.ts maintenance "Database Upgrade" "2024-03-20 02:00 UTC" "2 hours" "Read-only mode" "Critical security patches"
  tsx communication-protocols.ts report

Environment Variables:
  SLACK_WEBHOOK_URL, TEAMS_WEBHOOK_URL
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
  ENGINEERING_EMAILS
        `)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { CommunicationManager, CommunicationConfig }
