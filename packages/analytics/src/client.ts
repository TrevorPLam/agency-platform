'use client'

import posthog from 'posthog-js'

let isInitialized = false

/**
 * Initialize PostHog analytics for the client side.
 * This function must be called before any other analytics functions.
 * Sets up tenant-aware tracking as a super property.
 */
export function initAnalytics(tenantSlug: string): void {
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
 */
export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !isInitialized) {
    return
  }

  posthog.capture(event, properties)
}

/**
 * Identify a user in PostHog with tenant-aware distinction.
 * Combines user ID with tenant slug for unique identification across tenants.
 */
export function identifyUser(
  userId: string,
  tenantSlug: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !isInitialized) {
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
