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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Something went wrong.</p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
