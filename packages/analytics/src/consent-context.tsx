'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import {
  ConsentState,
  ConsentContext,
  ConsentCategory,
  ConsentStatus,
  DEFAULT_CONSENT_PREFERENCES,
  loadConsentFromStorage,
  saveConsentToStorage,
  clearConsentFromStorage,
  isConsentAllowed,
} from './consent'

const ConsentContextProvider = createContext<ConsentContext | null>(null)

export interface ConsentProviderProps {
  children: ReactNode
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentState>(() => {
    const stored = loadConsentFromStorage()
    if (stored) return stored

    return {
      preferences: DEFAULT_CONSENT_PREFERENCES,
      hasMadeChoice: false,
      lastUpdated: new Date(),
    }
  })

  // Save consent to localStorage whenever it changes
  useEffect(() => {
    if (consent.hasMadeChoice) {
      saveConsentToStorage(consent)
    }
  }, [consent])

  // Update consent for a specific category
  const updateConsent = (category: ConsentCategory, status: ConsentStatus) => {
    setConsent(prev => ({
      preferences: {
        ...prev.preferences,
        [category]: status,
      },
      hasMadeChoice: true,
      lastUpdated: new Date(),
    }))
  }

  // Accept all non-essential categories
  const acceptAll = () => {
    setConsent(prev => ({
      preferences: {
        ...prev.preferences,
        analytics: 'granted',
        marketing: 'granted',
        functional: 'granted',
      },
      hasMadeChoice: true,
      lastUpdated: new Date(),
    }))
  }

  // Deny all non-essential categories
  const denyAll = () => {
    setConsent(prev => ({
      preferences: {
        ...prev.preferences,
        analytics: 'denied',
        marketing: 'denied',
        functional: 'denied',
      },
      hasMadeChoice: true,
      lastUpdated: new Date(),
    }))
  }

  // Reset all consent choices
  const resetConsent = () => {
    clearConsentFromStorage()
    setConsent({
      preferences: DEFAULT_CONSENT_PREFERENCES,
      hasMadeChoice: false,
      lastUpdated: new Date(),
    })
  }

  // Check if a specific category is allowed
  const isCategoryAllowed = (category: ConsentCategory): boolean => {
    return isConsentAllowed(consent.preferences, category)
  }

  // Check if analytics consent is granted
  const hasAnalyticsConsent = (): boolean => {
    return isCategoryAllowed('analytics')
  }

  const contextValue: ConsentContext = {
    consent,
    updateConsent,
    acceptAll,
    denyAll,
    resetConsent,
    isCategoryAllowed,
    hasAnalyticsConsent,
  }

  return (
    <ConsentContextProvider value={contextValue}>
      {children}
    </ConsentContextProvider>
  )
}

/**
 * Hook to access consent context
 */
export function useConsent(): ConsentContext {
  const context = useContext(ConsentContextProvider)
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}

/**
 * Hook to check if analytics should be initialized
 */
export function useAnalyticsConsent(): boolean {
  const { hasAnalyticsConsent, consent } = useConsent()

  // Only return true if user has made a choice and consent is granted
  return consent.hasMadeChoice && hasAnalyticsConsent()
}
