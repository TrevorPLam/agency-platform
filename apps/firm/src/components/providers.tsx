'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@agency/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics('agency')
  }, [])

  return <>{children}</>
}
