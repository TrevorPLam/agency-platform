'use client'

import { useEffect } from 'react'
// import { initAnalytics } from '@agency/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics with the agency tenant slug
    // TODO: Re-enable once analytics package is properly integrated
    // initAnalytics('agency')
    console.log('Analytics would be initialized here with tenant: agency')
  }, [])

  return <>{children}</>
}
