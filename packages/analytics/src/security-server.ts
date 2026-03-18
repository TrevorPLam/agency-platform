import 'server-only'

export {
  SecurityEventType,
  SecuritySeverity,
  SecurityAlertType,
  type SecurityEvent,
  type SecurityAlert,
  type SecurityMetrics,
  createSecurityEvent,
  logSecurityEvent,
  SecurityEvents,
} from './security-events'

export {
  processSecurityAlerts,
  securityAlertingEngine,
  type AlertProcessingResult,
} from './security-alerting'

export {
  securityMonitoringEngine,
  calculateSecurityMetrics,
  detectThreatPatterns,
  getSecurityAlerts,
  type SecurityMonitoringConfig,
  type ThreatPattern,
} from './security-monitoring'