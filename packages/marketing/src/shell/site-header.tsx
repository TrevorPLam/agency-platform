'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import { Button, cn, Sheet, SheetContent, SheetTrigger, ThemeToggle } from '@agency/ui'
import type { SiteConfig } from '../types'

export function SiteHeader({ config }: { config: SiteConfig }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <header className={config.shell.header}>
      <div className={config.shell.headerContainer}>
        <Link href="/" className={config.shell.brandLink}>
          {config.name}
        </Link>

        <nav className={config.shell.desktopNav} aria-label="Main navigation">
          {config.nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(config.shell.navLink, pathname === href && config.shell.navLinkActive)}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

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
              <nav className={config.shell.mobileNav} aria-label="Main navigation">
                {config.nav.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      config.shell.mobileNavLink,
                      pathname === href && config.shell.mobileNavLinkActive
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
