'use client'

import { useEffect } from 'react'
import { Button } from '@agency/ui'

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Critical application error</h1>
            <p className="text-muted-foreground">
              A critical error occurred while loading the app shell. Try again or reload the page.
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <pre className="w-full overflow-auto rounded bg-muted p-3 text-left text-xs">{error.digest}</pre>
          )}
        </div>
      </body>
    </html>
  )
}
