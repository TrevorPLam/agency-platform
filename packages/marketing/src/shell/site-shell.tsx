import type { ReactNode } from 'react'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import type { SiteConfig } from '../types'

const DEFAULT_SKIP_LINK_CLASSNAME =
  'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

export function SiteShell({ children, config }: { children: ReactNode; config: SiteConfig }) {
  return (
    <>
      <a href="#main-content" className={config.shell.skipLink ?? DEFAULT_SKIP_LINK_CLASSNAME}>
        Skip to main content
      </a>
      <SiteHeader config={config} />
      <main id="main-content" className={config.shell.main ?? 'flex-1'}>
        {children}
      </main>
      <SiteFooter config={config} />
    </>
  )
}
