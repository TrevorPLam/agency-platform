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
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-md text-muted-foreground">
          We hit an unexpected issue while loading this page. Please try again.
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
        <details className="mt-4 text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Error details (development only)</summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-2">{error.digest}</pre>
        </details>
      )}
    </div>
  )
}
