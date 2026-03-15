import Link from 'next/link'
import { cn } from '@agency/ui'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/programs', label: 'Programs' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-background-primary/95 backdrop-blur">
      <div className="container flex h-14 max-w-4xl items-center justify-between mx-auto px-4">
        <Link href="/" className="font-semibold text-brand-primary text-lg">
          Riley Day Care
        </Link>
        <nav className="flex gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm font-medium text-text-primary hover:text-brand-primary transition-colors'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
