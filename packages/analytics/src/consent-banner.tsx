'use client'

import { useState } from 'react'
import { useConsent } from './consent-context'
import { CONSENT_CATEGORIES, type ConsentCategory } from './consent'

export interface ConsentBannerProps {
  className?: string
  showDetails?: boolean
  position?: 'bottom' | 'top' | 'center'
}

export function ConsentBanner({
  className = '',
  showDetails = false,
  position = 'bottom',
}: ConsentBannerProps) {
  const { consent, updateConsent, acceptAll, denyAll } = useConsent()
  const [showExpanded, setShowExpanded] = useState(false)

  // Don't show banner if user has already made a choice
  if (consent.hasMadeChoice) {
    return null
  }

  const positionClasses = {
    bottom: 'fixed bottom-0 left-0 right-0',
    top: 'fixed top-0 left-0 right-0',
    center: 'fixed inset-0 flex items-center justify-center',
  }

  const handleAcceptAll = () => {
    acceptAll()
  }

  const handleDenyAll = () => {
    denyAll()
  }

  const handleCategoryToggle = (category: ConsentCategory, checked: boolean) => {
    updateConsent(category, checked ? 'granted' : 'denied')
  }

  const handleSavePreferences = () => {
    setShowExpanded(false)
  }

  return (
    <div
      className={`${positionClasses[position]} z-50 bg-white border-t border-gray-200 shadow-lg ${className}`}
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
    >
      <div className="max-w-4xl mx-auto p-6">
        {!showExpanded ? (
          // Simple banner view
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 id="consent-title" className="text-lg font-semibold text-gray-900 mb-2">
                Privacy & Cookies
              </h2>
              <p id="consent-description" className="text-sm text-gray-600">
                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience.
                By clicking accept, you agree to this, as outlined in our{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  Cookie Policy
                </a>
                .
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDenyAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Accept All
              </button>
              {(showDetails || Object.values(consent.preferences).some(status => status !== 'pending')) && (
                <button
                  onClick={() => setShowExpanded(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        ) : (
          // Expanded view with category details
          <div className="space-y-6">
            <div>
              <h2 id="consent-title" className="text-lg font-semibold text-gray-900 mb-2">
                Privacy & Cookie Preferences
              </h2>
              <p id="consent-description" className="text-sm text-gray-600">
                We use different types of cookies and similar technologies to enhance and personalize your experience.
                You can choose which types of cookies you allow below.
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(CONSENT_CATEGORIES).map(([key, config]) => {
                const category = key as ConsentCategory
                const isRequired = config.required
                const isChecked = consent.preferences[category] === 'granted'

                return (
                  <div key={category} className="flex items-start space-x-3">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id={`consent-${category}`}
                        checked={isChecked}
                        disabled={isRequired}
                        onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={`consent-${category}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {config.title}
                        {isRequired && (
                          <span className="ml-2 text-xs text-gray-500">(Required)</span>
                        )}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        {config.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Accept All
              </button>
              <button
                onClick={handleDenyAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simple consent banner for minimal UI
 */
export function SimpleConsentBanner({ className = '' }: { className?: string }) {
  return (
    <ConsentBanner
      className={className}
      showDetails={false}
      position="bottom"
    />
  )
}

/**
 * Consent settings component for privacy policy or settings page
 */
export function ConsentSettings({ className = '' }: { className?: string }) {
  const { consent, updateConsent, acceptAll, denyAll, resetConsent } = useConsent()
  const [hasChanges, setHasChanges] = useState(false)

  const handleCategoryToggle = (category: ConsentCategory, checked: boolean) => {
    updateConsent(category, checked ? 'granted' : 'denied')
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    setHasChanges(false)
  }

  const handleResetAll = () => {
    resetConsent()
    setHasChanges(false)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Cookie & Privacy Preferences
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your privacy preferences and cookie settings below.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(CONSENT_CATEGORIES).map(([key, config]) => {
          const category = key as ConsentCategory
          const isRequired = config.required
          const isChecked = consent.preferences[category] === 'granted'

          return (
            <div key={category} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id={`settings-consent-${category}`}
                  checked={isChecked}
                  disabled={isRequired}
                  onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor={`settings-consent-${category}`}
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  {config.title}
                  {isRequired && (
                    <span className="ml-2 text-xs text-gray-500">(Always Required)</span>
                  )}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveChanges}
          disabled={!hasChanges}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
        <button
          onClick={acceptAll}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Accept All
        </button>
        <button
          onClick={denyAll}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reject All
        </button>
        <button
          onClick={handleResetAll}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Reset All
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <p>Last updated: {consent.lastUpdated.toLocaleDateString()}</p>
        <p>Choices made: {consent.hasMadeChoice ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
