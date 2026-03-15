import Link from 'next/link'
import { cn } from '@agency/ui'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <Link href="/" className="font-semibold text-slate-900 text-lg">
          Agency
        </Link>
        <nav className="flex gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn('text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors')}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
