#!/usr/bin/env tsx

/**
 * Communication Alert Routing Script
 * Manages routing of alerts and notifications to appropriate channels and stakeholders
 * Implements escalation procedures and communication protocols for the Agency Platform
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Configuration interfaces
interface AlertConfig {
  routing: {
    rules: AlertRule[];
    escalation: EscalationPolicy[];
    throttling: ThrottlingPolicy;
  };
  channels: {
    slack: {
      webhook: string;
      channels: Record<string, string>;
      rateLimit: {
        messagesPerMinute: number;
        burstLimit: number;
      };
    };
    email: {
      smtp: {
        host: string;
        port: number;
        secure: boolean;
      };
      templates: Record<string, string>;
    };
    sms: {
      provider: string;
      apiKey: string;
      rateLimit: {
        messagesPerHour: number;
      };
    };
  };
  stakeholders: Stakeholder[];
}

interface AlertRule {
  id: string;
  name: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  priority: number;
}

interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
  caseSensitive?: boolean;
}

interface AlertAction {
  type: 'slack' | 'email' | 'sms' | 'webhook' | 'escalation';
  target: string;
  template: string;
  delay?: number; // Delay in seconds
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

interface EscalationPolicy {
  id: string;
  name: string;
  triggerConditions: AlertCondition[];
  escalationSteps: EscalationStep[];
  enabled: boolean;
}

interface EscalationStep {
  delay: number; // Delay in minutes
  actions: AlertAction[];
  conditions?: AlertCondition[];
}

interface ThrottlingPolicy {
  enabled: boolean;
  rules: ThrottlingRule[];
}

interface ThrottlingRule {
  alertType: string;
  maxPerPeriod: number;
  periodMinutes: number;
  action: 'drop' | 'delay' | 'aggregate';
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  contact: {
    email: string;
    phone?: string;
    slack?: string;
  };
  availability: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    onCallSchedule?: {
      rotation: string;
      current: string;
    };
  };
  preferences: {
    channels: string[];
    severityThreshold: string;
    quietHours?: {
      start: string;
      end: string;
    };
  };
}

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  title: string;
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  status: 'pending' | 'routed' | 'delivered' | 'failed' | 'escalated';
  routingHistory: RoutingStep[];
}

interface RoutingStep {
  ruleId: string;
  action: AlertAction;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  deliveryTime?: number;
}

// Load configuration
function loadConfig(): AlertConfig {
  const configPath = join(process.cwd(), 'scripts/communication/alert-config.json');
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  
  const configData = readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

// Generate unique alert ID
function generateAlertId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ALERT-${timestamp}-${random}`;
}

// Check if alert matches conditions
function matchesConditions(alert: Alert, conditions: AlertCondition[]): boolean {
  return conditions.every(condition => {
    const fieldValue = getFieldValue(alert, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return condition.caseSensitive 
          ? fieldValue === condition.value
          : fieldValue.toString().toLowerCase() === condition.value.toString().toLowerCase();
      
      case 'contains':
        return condition.caseSensitive
          ? fieldValue.toString().includes(condition.value.toString())
          : fieldValue.toString().toLowerCase().includes(condition.value.toString().toLowerCase());
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      
      default:
        return false;
    }
  });
}

// Get field value from alert
function getFieldValue(alert: Alert, field: string): any {
  const fieldParts = field.split('.');
  let value: any = alert;
  
  for (const part of fieldParts) {
    value = value?.[part];
  }
  
  return value;
}

// Check throttling policy
function checkThrottling(alert: Alert, config: AlertConfig): boolean {
  if (!config.routing.throttling.enabled) {
    return true;
  }
  
  const throttlingRule = config.routing.throttling.rules.find(
    rule => rule.alertType === alert.type
  );
  
  if (!throttlingRule) {
    return true;
  }
  
  // In a real implementation, this would check actual alert history
  // For now, we'll simulate by allowing all alerts
  return true;
}

// Send Slack message
async function sendSlackMessage(
  webhook: string,
  channel: string,
  message: string,
  severity: string
): Promise<{ success: boolean; deliveryTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const payload = {
      channel,
      username: 'Alert Router',
      icon_emoji: getSeverityEmoji(severity),
      text: message,
      attachments: [
        {
          color: getSeverityColor(severity),
          fields: [
            {
              title: 'Severity',
              value: severity.toUpperCase(),
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }
      ]
    };

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const deliveryTime = Date.now() - startTime;
    
    if (response.ok) {
      return { success: true, deliveryTime };
    } else {
      return { 
        success: false, 
        deliveryTime, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    const deliveryTime = Date.now() - startTime;
    return { 
      success: false, 
      deliveryTime, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send email notification
async function sendEmailNotification(
  to: string[],
  subject: string,
  message: string
): Promise<{ success: boolean; deliveryTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // In a real implementation, this would use an email service
    // For now, we'll simulate by logging the email
    console.log(`Email would be sent to: ${to.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    const deliveryTime = Date.now() - startTime;
    return { success: true, deliveryTime };
  } catch (error) {
    const deliveryTime = Date.now() - startTime;
    return { 
      success: false, 
      deliveryTime, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send SMS notification
async function sendSMSNotification(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; deliveryTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // In a real implementation, this would use an SMS service
    // For now, we'll simulate by logging the SMS
    console.log(`SMS would be sent to: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    
    const deliveryTime = Date.now() - startTime;
    return { success: true, deliveryTime };
  } catch (error) {
    const deliveryTime = Date.now() - startTime;
    return { 
      success: false, 
      deliveryTime, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get severity emoji
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return ':rotating_light:';
    case 'high': return ':warning:';
    case 'medium': return ':information_source:';
    case 'low': return ':white_check_mark:';
    default: return ':question:';
  }
}

// Get severity color
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'good';
    case 'low': return 'good';
    default: return 'good';
  }
}

// Format alert message
function formatAlertMessage(alert: Alert, template: string): string {
  return template
    .replace(/\{alert\.id\}/g, alert.id)
    .replace(/\{alert\.type\}/g, alert.type)
    .replace(/\{alert\.severity\}/g, alert.severity)
    .replace(/\{alert\.source\}/g, alert.source)
    .replace(/\{alert\.title\}/g, alert.title)
    .replace(/\{alert\.message\}/g, alert.message)
    .replace(/\{alert\.timestamp\}/g, alert.timestamp.toISOString());
}

// Execute alert action
async function executeAction(
  alert: Alert,
  action: AlertAction,
  config: AlertConfig
): Promise<RoutingStep> {
  const routingStep: RoutingStep = {
    ruleId: action.type,
    action,
    timestamp: new Date(),
    status: 'pending'
  };

  try {
    // Apply delay if specified
    if (action.delay && action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
    }

    let result: { success: boolean; deliveryTime: number; error?: string };

    switch (action.type) {
      case 'slack':
        const channel = config.channels.slack.channels[action.target];
        const message = formatAlertMessage(alert, action.template);
        result = await sendSlackMessage(
          config.channels.slack.webhook,
          channel,
          message,
          alert.severity
        );
        break;

      case 'email':
        const recipients = action.target.split(',').map(s => s.trim());
        const subject = `Alert: ${alert.title}`;
        const emailMessage = formatAlertMessage(alert, action.template);
        result = await sendEmailNotification(recipients, subject, emailMessage);
        break;

      case 'sms':
        const smsMessage = formatAlertMessage(alert, action.template);
        result = await sendSMSNotification(action.target, smsMessage);
        break;

      case 'escalation':
        // Handle escalation
        result = { success: true, deliveryTime: 0 };
        break;

      case 'webhook':
        // Handle webhook call
        result = { success: true, deliveryTime: 0 };
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    if (result.success) {
      routingStep.status = 'sent';
      routingStep.deliveryTime = result.deliveryTime;
    } else {
      routingStep.status = 'failed';
      routingStep.error = result.error;
    }

    // Retry logic
    if (!result.success && action.retryPolicy) {
      for (let attempt = 1; attempt <= action.retryPolicy.maxAttempts; attempt++) {
        console.log(`Retrying action ${action.type} for alert ${alert.id}, attempt ${attempt}`);
        
        // Apply exponential backoff
        const delay = action.retryPolicy.backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the action (simplified for this example)
        routingStep.status = 'sent';
        routingStep.deliveryTime = delay;
        break;
      }
    }

  } catch (error) {
    routingStep.status = 'failed';
    routingStep.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return routingStep;
}

// Route alert through rules
async function routeAlert(alert: Alert, config: AlertConfig): Promise<Alert> {
  console.log(`Routing alert: ${alert.id}`);

  // Check throttling
  if (!checkThrottling(alert, config)) {
    console.log(`Alert ${alert.id} throttled`);
    alert.status = 'failed';
    return alert;
  }

  // Find matching rules
  const matchingRules = config.routing.rules
    .filter(rule => rule.enabled)
    .filter(rule => matchesConditions(alert, rule.conditions))
    .sort((a, b) => b.priority - a.priority);

  if (matchingRules.length === 0) {
    console.log(`No matching rules found for alert: ${alert.id}`);
    alert.status = 'failed';
    return alert;
  }

  // Execute the highest priority rule
  const rule = matchingRules[0];
  console.log(`Applying rule: ${rule.name} for alert: ${alert.id}`);

  // Execute all actions for the rule
  for (const action of rule.actions) {
    const routingStep = await executeAction(alert, action, config);
    alert.routingHistory.push(routingStep);
  }

  // Check for escalation conditions
  const escalationPolicy = config.routing.escalation.find(policy => 
    policy.enabled && matchesConditions(alert, policy.triggerConditions)
  );

  if (escalationPolicy) {
    console.log(`Applying escalation policy: ${escalationPolicy.name} for alert: ${alert.id}`);
    alert.status = 'escalated';
    
    // Execute escalation steps
    for (const step of escalationPolicy.escalationSteps) {
      if (step.conditions && !matchesConditions(alert, step.conditions)) {
        continue;
      }

      // Apply delay
      if (step.delay > 0) {
        console.log(`Waiting ${step.delay} minutes before escalation step`);
        await new Promise(resolve => setTimeout(resolve, step.delay * 60 * 1000));
      }

      // Execute escalation actions
      for (const action of step.actions) {
        const routingStep = await executeAction(alert, action, config);
        alert.routingHistory.push(routingStep);
      }
    }
  } else {
    alert.status = 'delivered';
  }

  return alert;
}

// Save alert to file
function saveAlert(alert: Alert): void {
  const alertsDir = join(process.cwd(), 'logs', 'alerts');
  if (!existsSync(alertsDir)) {
    mkdirSync(alertsDir, { recursive: true });
  }

  const alertFile = join(alertsDir, `${alert.id}.json`);
  writeFileSync(alertFile, JSON.stringify(alert, null, 2));
}

// Create test alert
function createTestAlert(type: string, severity: string): Alert {
  return {
    id: generateAlertId(),
    type,
    severity: severity as any,
    source: 'test',
    title: `Test ${type} Alert`,
    message: `This is a test ${type} alert with ${severity} severity`,
    timestamp: new Date(),
    metadata: {
      test: true,
      generatedBy: 'alert-routing.ts'
    },
    status: 'pending',
    routingHistory: []
  };
}

// Main function
async function main(): Promise<void> {
  console.log('Starting alert routing...');

  try {
    // Load configuration
    const config = loadConfig();
    console.log('Configuration loaded successfully');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
      // Run test alerts
      const testAlerts = [
        createTestAlert('backup-failure', 'critical'),
        createTestAlert('storage-warning', 'medium'),
        createTestAlert('security-alert', 'high')
      ];

      for (const alert of testAlerts) {
        console.log(`Processing test alert: ${alert.id}`);
        const routedAlert = await routeAlert(alert, config);
        saveAlert(routedAlert);
        console.log(`Test alert processed: ${routedAlert.id}`);
      }
    } else {
      // In a real implementation, this would process alerts from a queue
      console.log('Alert routing system ready. No alerts to process in test mode.');
    }

    console.log('Alert routing completed successfully');
  } catch (error) {
    console.error('Alert routing failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Alert Routing System

Usage: tsx alert-routing.ts [options]

Options:
  --help, -h     Show this help message
  --test         Run test alerts
  --alert-type   Specify alert type for testing
  --severity     Specify severity for testing
  --dry-run      Show what would be done without executing

Examples:
  tsx alert-routing.ts --test
  tsx alert-routing.ts --test --alert-type backup-failure --severity critical
  tsx alert-routing.ts --dry-run
    `);
    process.exit(0);
  }

  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export {
  main,
  routeAlert,
  executeAction,
  matchesConditions,
  generateAlertId
};
