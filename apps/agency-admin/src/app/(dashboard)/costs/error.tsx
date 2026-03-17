'use client'

import { useEffect } from 'react'
import { Button } from '@agency/ui'

export default function CostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Unable to load cost data</h1>
        <p className="text-muted-foreground">
          This view is temporarily unavailable. Retry now or return to the dashboard.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => (window.location.href = '/')} variant="outline">
          Go home
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && error.digest && (
        <details className="text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Error details (development only)</summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-2">{error.digest}</pre>
        </details>
      )}
    </div>
  )
}
