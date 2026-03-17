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
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground max-w-md">
          We apologize for the inconvenience. An unexpected error occurred while loading this page.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button 
          onClick={() => window.location.href = '/'} 
          variant="outline"
        >
          Go home
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && error.digest && (
        <details className="text-left text-xs text-muted-foreground mt-4">
          <summary className="cursor-pointer hover:text-foreground">
            Error details (development only)
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
            {error.digest}
          </pre>
        </details>
      )}
    </div>
  )
}
