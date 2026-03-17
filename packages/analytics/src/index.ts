// Client-side analytics exports
export { initAnalytics, captureEvent, identifyUser, resetUser, getPostHogClient } from './client'

// Server-side analytics exports
export {
  captureServerEvent,
  identifyServerUser,
  aliasServerUser,
  flushServerEvents,
  getPostHogServerClient,
  type ServerEventProperties,
} from './server'

// CSP nonce utilities
export { getCspNonce, isCspEnabled } from './nonce'

// Analytics provider component
export { AnalyticsProvider } from './provider'

// CSP nonce provider component
export { CspNonceProvider } from './csp-provider'

// Security monitoring exports
export {
  SecurityEventType,
  SecuritySeverity,
  SecurityAlertType,
  type SecurityEvent,
  type SecurityAlert,
  type SecurityMetrics,
  type ThreatIntelligence,
  createSecurityEvent,
  logSecurityEvent,
  SecurityEvents,
} from './security-events'

export {
  type AlertRule,
  type AlertCondition,
  type AlertThreshold,
  type AlertAction,
  type AlertProcessingResult,
  SecurityAlertingEngine,
  securityAlertingEngine,
  processSecurityAlerts,
  getAlertRules,
  addAlertRule,
} from './security-alerting'

export {
  type SecurityMonitoringConfig,
  type IndicatorOfCompromise,
  type ThreatPattern,
  type ThreatSignature,
  SecurityMonitoringEngine,
  securityMonitoringEngine,
  calculateSecurityMetrics,
  detectThreatPatterns,
  getSecurityAlerts,
} from './security-monitoring'
