import Link from 'next/link'
import { cn } from '@agency/ui'

const ADDRESS = '2629 N Stemmons Fwy STE 104, Dallas, TX 75207'

export function SiteFooter() {
  return (
    <footer className="border-t border-border-primary bg-background-secondary mt-auto">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-text-secondary text-center sm:text-left">
            <p>© {new Date().getFullYear()} The Barber Cave. All rights reserved.</p>
            <p className="mt-1">{ADDRESS}</p>
          </div>
          <nav className="flex gap-6">
            <Link
              href="/services"
              className={cn('text-sm text-text-secondary hover:text-brand-primary')}
            >
              Services
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
