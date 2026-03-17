/**
 * Consent management types and utilities for privacy compliance
 * Supports GDPR, CCPA, and other privacy frameworks
 */

export interface ConsentPreferences {
  analytics: ConsentStatus
  marketing: ConsentStatus
  functional: ConsentStatus
  necessary: ConsentStatus // Always required for basic functionality
}

export type ConsentCategory = keyof Omit<ConsentPreferences, 'necessary'>

export type ConsentStatus = 'granted' | 'denied' | 'pending'

export interface ConsentState {
  preferences: ConsentPreferences
  hasMadeChoice: boolean
  lastUpdated: Date
}

export interface ConsentContext {
  consent: ConsentState
  updateConsent: (category: ConsentCategory, status: ConsentStatus) => void
  acceptAll: () => void
  denyAll: () => void
  resetConsent: () => void
  isCategoryAllowed: (category: ConsentCategory) => boolean
  hasAnalyticsConsent: () => boolean
}

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  analytics: 'pending',
  marketing: 'pending',
  functional: 'pending',
  necessary: 'granted', // Essential cookies are always required
}

export const CONSENT_STORAGE_KEY = 'agency_consent_preferences'

export const CONSENT_CATEGORIES = {
  analytics: {
    title: 'Analytics Cookies',
    description: 'Help us understand how you use our services and improve them',
    required: false,
  },
  marketing: {
    title: 'Marketing Cookies',
    description: 'Used to deliver advertising that is relevant to you',
    required: false,
  },
  functional: {
    title: 'Functional Cookies',
    description: 'Enable personalized features and site functionality',
    required: false,
  },
  necessary: {
    title: 'Essential Cookies',
    description: 'Required for the website to function properly',
    required: true,
  },
} as const

/**
 * Data retention periods (in days) based on privacy best practices
 */
export const DATA_RETENTION_PERIODS = {
  analytics: 365, // 1 year for analytics data
  marketing: 180, // 6 months for marketing data
  functional: 730, // 2 years for functional preferences
  necessary: 0, // Essential data retained until user deletion
} as const

/**
 * Check if consent is allowed for a specific category
 */
export function isConsentAllowed(
  preferences: ConsentPreferences,
  category: ConsentCategory
): boolean {
  return preferences[category] === 'granted'
}

/**
 * Validate consent preferences object
 */
export function validateConsentPreferences(
  preferences: Partial<ConsentPreferences>
): ConsentPreferences {
  return {
    analytics: preferences.analytics ?? DEFAULT_CONSENT_PREFERENCES.analytics,
    marketing: preferences.marketing ?? DEFAULT_CONSENT_PREFERENCES.marketing,
    functional: preferences.functional ?? DEFAULT_CONSENT_PREFERENCES.functional,
    necessary: 'granted', // Always required
  }
}

/**
 * Load consent preferences from localStorage
 */
export function loadConsentFromStorage(): ConsentState | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return {
      preferences: validateConsentPreferences(parsed.preferences),
      hasMadeChoice: parsed.hasMadeChoice ?? false,
      lastUpdated: new Date(parsed.lastUpdated),
    }
  } catch (error) {
    console.warn('Failed to load consent preferences from storage:', error)
    return null
  }
}

/**
 * Save consent preferences to localStorage
 */
export function saveConsentToStorage(consent: ConsentState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
  } catch (error) {
    console.warn('Failed to save consent preferences to storage:', error)
  }
}

/**
 * Clear all consent data from localStorage
 */
export function clearConsentFromStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear consent preferences from storage:', error)
  }
}
