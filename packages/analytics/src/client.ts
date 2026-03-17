'use client'

import posthog from 'posthog-js'

let isInitialized = false

/**
 * Initialize PostHog analytics for the client side.
 * This function must be called before any other analytics functions.
 * Sets up tenant-aware tracking as a super property.
 * NOTE: This should only be called after consent has been granted.
 */
export function initAnalytics(tenantSlug: string, nonce?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!isInitialized && process.env['NEXT_PUBLIC_POSTHOG_KEY']) {
    const config: Record<string, unknown> = {
      loaded: (ph: unknown) => {
        // GDPR: do not capture IP address (EU and privacy-conscious clients).
        // capture_ip is supported at runtime; PostHogConfig types may not include it.
        ;(ph as { set_config: (c: Record<string, unknown>) => void }).set_config({
          capture_ip: false,
        })
        if (process.env['NODE_ENV'] === 'development') {
          (ph as { debug: () => void }).debug()
        }
        // Set user identification
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.posthog = ph
        }
      },
    }

    const host = process.env['NEXT_PUBLIC_POSTHOG_HOST']
    if (host) {
      config['api_host'] = host
    }

    // Add nonce support for CSP compliance
    if (nonce) {
      config['prepare_external_dependency_script'] = (script: HTMLScriptElement) => {
        script.nonce = nonce
        return script
      }
      config['prepare_external_dependency_stylesheet'] = (stylesheet: HTMLLinkElement) => {
        stylesheet.nonce = nonce
        return stylesheet
      }
    }

    posthog.init(process.env['NEXT_PUBLIC_POSTHOG_KEY'], config)

    // Register tenant as a super property for all subsequent events
    posthog.register({
      tenant: tenantSlug,
    })

    isInitialized = true
  }
}

/**
 * Capture an analytics event on the client side.
 * Tenant is automatically included as a super property.
 * This function will not capture events if consent has not been granted.
 */
export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !isInitialized) {
    return
  }

  // Check if user has granted consent for analytics
  const posthogClient = posthog
  if (posthogClient.get_explicit_consent_status() !== 'granted') {
    return
  }

  posthog.capture(event, properties)
}

/**
 * Identify a user in PostHog with tenant-aware distinction.
 * Combines user ID with tenant slug for unique identification across tenants.
 * This function will not identify users if consent has not been granted.
 */
export function identifyUser(
  userId: string,
  tenantSlug: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !isInitialized) {
    return
  }

  // Check if user has granted consent for analytics
  const posthogClient = posthog
  if (posthogClient.get_explicit_consent_status() !== 'granted') {
    return
  }

  // Create tenant-specific user ID to maintain uniqueness across tenants
  const tenantSpecificUserId = `${userId}@${tenantSlug}`

  posthog.identify(tenantSpecificUserId, {
    ...properties,
    tenant: tenantSlug,
  })
}

/**
 * Reset the user identification on logout.
 * Clears the current user and their tenant-specific data.
 */
export function resetUser(): void {
  if (typeof window === 'undefined' || !isInitialized) {
    return
  }

  posthog.reset()
}

/**
 * Get the raw PostHog client for advanced usage.
 * Use sparingly and prefer the typed functions above.
 */
export function getPostHogClient() {
  if (typeof window === 'undefined' || !isInitialized) {
    return null
  }

  return posthog
}

/**
 * Initialize analytics with consent awareness.
 * This function should be used instead of initAnalytics when consent management is enabled.
 * It will only initialize PostHog if consent has been granted for analytics.
 */
export function initAnalyticsWithConsent(
  tenantSlug: string,
  hasConsent: boolean,
  nonce?: string
): void {
  if (!hasConsent) {
    return
  }

  initAnalytics(tenantSlug, nonce)
}

/**
 * Grant consent for analytics and initialize tracking.
 * This should be called when user grants analytics consent.
 */
export function grantAnalyticsConsent(tenantSlug: string, nonce?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  // If PostHog is already initialized, just opt in
  if (isInitialized) {
    posthog.opt_in_capturing()
  } else {
    // Initialize PostHog with consent granted
    initAnalytics(tenantSlug, nonce)
  }
}

/**
 * Revoke consent for analytics.
 * This should be called when user denies analytics consent.
 */
export function revokeAnalyticsConsent(): void {
  if (typeof window === 'undefined' || !isInitialized) {
    return
  }

  posthog.opt_out_capturing()
}

/**
 * Check if analytics consent has been granted.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined' || !isInitialized) {
    return false
  }

  return posthog.get_explicit_consent_status() === 'granted'
}
