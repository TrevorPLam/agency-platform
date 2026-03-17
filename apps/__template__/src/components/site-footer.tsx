import Link from 'next/link'
import { cn } from '@agency/ui'

export function SiteFooter() {
  return (
    <footer className="border-border-primary bg-background-secondary mt-auto border-t">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-text-secondary text-sm">
            © {new Date().getFullYear()} TEMPLATE_NAME. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link href="/services" className={cn('text-text-secondary hover:text-brand-primary text-sm')}>
              Services
            </Link>
            <Link href="/about" className={cn('text-text-secondary hover:text-brand-primary text-sm')}>
              About
            </Link>
            <Link href="/contact" className={cn('text-text-secondary hover:text-brand-primary text-sm')}>
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
