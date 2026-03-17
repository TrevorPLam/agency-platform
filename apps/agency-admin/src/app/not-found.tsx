import Link from 'next/link'
import { Button } from '@agency/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          The page you requested does not exist or may have been moved.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
