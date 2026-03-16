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
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <p className="text-muted-foreground">Failed to load cost data.</p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
