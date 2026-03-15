import Link from 'next/link'
import { cn } from '@agency/ui'

export function SiteFooter() {
  return (
    <footer className="border-t border-border-primary bg-background-secondary mt-auto">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-secondary">
            © {new Date().getFullYear()} Riley Day Care. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/programs"
              className={cn('text-sm text-text-secondary hover:text-brand-primary')}
            >
              Programs
            </Link>
            <Link
              href="/about"
              className={cn('text-sm text-text-secondary hover:text-brand-primary')}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={cn('text-sm text-text-secondary hover:text-brand-primary')}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
