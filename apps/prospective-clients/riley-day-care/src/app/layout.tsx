import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SiteProviders } from '@agency/marketing/providers'
import { SiteShell } from '@agency/marketing/shell'
import './globals.css'
import { AuthAnalytics } from '@/components/auth-analytics'
import { siteConfig } from '@/config/site'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002'
  ),
  title: { default: 'Riley Day Care', template: '%s | Riley Day Care' },
  description: 'Quality child care and early learning in a safe, nurturing environment.',
  openGraph: { title: 'Riley Day Care', description: 'Quality child care and early learning.' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme={siteConfig.slug}>
      <body className="flex min-h-screen flex-col">
        <SiteProviders tenantSlug={siteConfig.slug} authAnalytics={<AuthAnalytics />}>
          <SiteShell config={siteConfig}>{children}</SiteShell>
        </SiteProviders>
      </body>
    </html>
  )
}
