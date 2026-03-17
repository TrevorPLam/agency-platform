import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  ),
  title: { default: 'Agency — Digital Marketing Excellence', template: '%s | Agency' },
  description:
    'Leading digital agency delivering exceptional marketing solutions that drive growth.',
  openGraph: {
    title: 'Agency — Digital Marketing Excellence',
    description: 'Leading digital agency delivering exceptional marketing solutions.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}
