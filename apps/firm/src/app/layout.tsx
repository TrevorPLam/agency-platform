import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'

export const metadata: Metadata = {
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
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}
