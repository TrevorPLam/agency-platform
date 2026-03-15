import Link from 'next/link'
import { cn } from '@agency/ui'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Agency. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link href="/services" className={cn('text-sm text-slate-600 hover:text-slate-900')}>
              Services
            </Link>
            <Link href="/about" className={cn('text-sm text-slate-600 hover:text-slate-900')}>
              About
            </Link>
            <Link href="/contact" className={cn('text-sm text-slate-600 hover:text-slate-900')}>
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
