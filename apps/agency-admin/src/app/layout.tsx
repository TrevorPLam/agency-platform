import './globals.css'
import { ThemeToggle } from '@agency/ui'
import { Providers } from '../components/providers'
import { HeaderAuth } from '../components/header-auth'

export const metadata = {
  title: 'Agency Admin - Internal Dashboard',
  description: 'Internal control panel for agency operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-[var(--color-semantic-background-primary)]">
        <Providers>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <header className="flex h-14 items-center justify-end gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
            <HeaderAuth />
            <ThemeToggle />
          </header>
          <main id="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
