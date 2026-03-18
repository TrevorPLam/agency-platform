'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import { cn, ThemeToggle, Button, Sheet, SheetContent, SheetTrigger } from '@agency/ui'
import { useState, useEffect } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile nav on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <header className="border-border-primary bg-background-primary/95 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-brand-primary text-lg font-semibold">
          The Barber Cave
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-text-primary hover:text-brand-primary text-sm font-medium transition-colors',
                pathname === href && 'text-brand-primary'
              )}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" showCloseButton={false}>
            <div className="flex flex-col gap-6">
              <nav className="flex flex-col gap-4" aria-label="Main navigation">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'text-lg font-medium text-text-primary hover:text-brand-primary transition-colors',
                      pathname === href && 'text-brand-primary'
                    )}
                    aria-current={pathname === href ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
