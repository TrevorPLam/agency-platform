'use client'

import { useEffect } from 'react'
import { Button } from '@agency/ui'

export default function Error({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-foreground mb-2 text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          We apologize for the inconvenience. An unexpected error occurred while loading this page.
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

      {process.env['NODE_ENV'] === 'development' && error.digest && (
        <details className="text-muted-foreground mt-4 text-left text-xs">
          <summary className="hover:text-foreground cursor-pointer">
            Error details (development only)
          </summary>
          <pre className="bg-muted mt-2 overflow-auto rounded p-2">{error.digest}</pre>
        </details>
      )}
    </div>
  )
}
