// Client-side analytics exports
export {
  initAnalytics,
  captureEvent,
  identifyUser,
  resetUser,
  getPostHogClient,
  initAnalyticsWithConsent,
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  hasAnalyticsConsent
} from './client'

// Consent management exports
export {
  ConsentProvider,
  useConsent,
  useAnalyticsConsent,
  ConsentBanner,
  SimpleConsentBanner,
  ConsentSettings,
  type ConsentState,
  type ConsentContext,
  type ConsentPreferences,
  type ConsentCategory,
  type ConsentStatus,
  type ConsentProviderProps,
  type ConsentBannerProps,
  DEFAULT_CONSENT_PREFERENCES,
  CONSENT_STORAGE_KEY,
  CONSENT_CATEGORIES,
  isConsentAllowed,
  validateConsentPreferences,
  loadConsentFromStorage,
  saveConsentToStorage,
  clearConsentFromStorage,
} from './consent-context'

export {
  type ConsentPreferences as ConsentTypes,
  type ConsentCategory as ConsentCategoryType,
  type ConsentStatus as ConsentStatusType,
  type ConsentState as ConsentStateType,
  DEFAULT_CONSENT_PREFERENCES as DefaultConsentPreferences,
  CONSENT_STORAGE_KEY as ConsentStorageKey,
  CONSENT_CATEGORIES as ConsentCategories,
  DATA_RETENTION_PERIODS as DataRetentionPeriods,
} from './consent'

export { ConsentBanner as ConsentBannerComponent } from './consent-banner'

// CSP nonce utilities
export { getCspNonce, isCspEnabled } from './nonce'

// Analytics provider component
export { AnalyticsProvider } from './provider'

// CSP nonce provider component
export { CspNonceProvider } from './csp-provider'

// Server-side analytics exports
export {
  captureServerEvent,
  identifyServerUser,
  aliasServerUser,
  flushServerEvents,
  getPostHogServerClient,
  type ServerEventProperties,
} from './server'

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
