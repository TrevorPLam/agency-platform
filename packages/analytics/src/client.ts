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

  if (!isInitialized && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug()
        }
      },
    })

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
export function captureEvent(
  event: string,
  properties?: Record<string, any>
): void {
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
  properties?: Record<string, any>
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
