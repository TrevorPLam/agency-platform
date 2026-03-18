import Link from 'next/link'
import { cn } from '@agency/ui'
import type { SiteConfig } from '../types'

export function SiteFooter({ config }: { config: SiteConfig }) {
  const legalName = config.footer.legalName ?? config.name

  return (
    <footer className={config.shell.footer}>
      <div className={config.shell.footerContainer}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div
            className={cn(
              config.shell.footerText,
              config.footer.secondaryText && 'text-center sm:text-left'
            )}
          >
            <p>
              © {new Date().getFullYear()} {legalName}. All rights reserved.
            </p>
            {config.footer.secondaryText ? (
              <p className="mt-1">{config.footer.secondaryText}</p>
            ) : null}
          </div>
          <nav className="flex gap-6">
            {config.footer.links.map(({ href, label }) => (
              <Link key={href} href={href} className={config.shell.footerNavLink}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
