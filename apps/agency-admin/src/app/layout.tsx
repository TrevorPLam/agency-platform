import './globals.css'
import { ThemeToggle } from '@agency/ui'
import { Providers } from '../components/providers'

export const metadata = {
  title: 'Agency Admin - Internal Dashboard',
  description: 'Internal control panel for agency operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-[var(--color-semantic-background-primary)]">
        <Providers>
          <header className="flex h-14 items-center justify-end border-b border-slate-200 px-4 dark:border-slate-700">
            <ThemeToggle />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  )
}
