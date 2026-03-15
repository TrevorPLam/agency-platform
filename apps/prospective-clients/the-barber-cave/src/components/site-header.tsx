import Link from 'next/link'
import { cn } from '@agency/ui'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  return (
    <header className="border-border-primary bg-background-primary/95 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-brand-primary text-lg font-semibold">
          The Barber Cave
        </Link>
        <nav className="flex gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-text-primary hover:text-brand-primary text-sm font-medium transition-colors'
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
