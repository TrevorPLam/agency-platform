'use client'

import { useEffect } from 'react'
import { initAnalytics } from './client'

interface AnalyticsProviderProps {
  tenantSlug: string
  children: React.ReactNode
}

/**
 * Analytics Provider Component
 * Initializes PostHog analytics with CSP nonce support
 */
export function AnalyticsProvider({ tenantSlug, children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Try to get nonce from a global variable or meta tag
    // This will be set by the middleware via a script or data attribute
    let nonce: string | undefined

    // Method 1: Check for nonce in meta tag
    const metaNonce = document.querySelector('meta[name="csp-nonce"]')
    if (metaNonce) {
      nonce = metaNonce.getAttribute('content') || undefined
    }

    // Method 2: Check for nonce in data attribute on body
    if (!nonce) {
      const bodyNonce = document.body.getAttribute('data-csp-nonce')
      nonce = bodyNonce || undefined
    }

    // Method 3: Check for nonce in global variable (set by server component)
    if (!nonce && typeof window !== 'undefined' && (window as any).__CSP_NONCE__) {
      nonce = (window as any).__CSP_NONCE__
    }

    initAnalytics(tenantSlug)
  }, [tenantSlug])

  return <>{children}</>
}
