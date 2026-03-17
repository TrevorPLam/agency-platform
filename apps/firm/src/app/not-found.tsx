import Link from 'next/link'
import { Button } from '@agency/ui'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found - Agency Platform',
  description: 'The page you are looking for does not exist. Return to our homepage to explore our services.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Page not found
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          The page you are looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button asChild variant="default">
          <Link href="/">
            Go home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">
            Contact us
          </Link>
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-8">
        <p>
          Looking for something specific?{' '}
          <Link 
            href="/services" 
            className="text-primary hover:underline"
          >
            Browse our services
          </Link>{' '}
          or{' '}
          <Link 
            href="/about" 
            className="text-primary hover:underline"
          >
            learn about our agency
          </Link>.
        </p>
      </div>
    </div>
  )
}
