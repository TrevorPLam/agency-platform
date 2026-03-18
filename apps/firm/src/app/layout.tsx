import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LocalBusiness, WithContext, WebSite } from 'schema-dts'
import './globals.css'
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

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
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  // JSON-LD structured data for LocalBusiness
  const localBusiness: WithContext<LocalBusiness> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Agency',
    description: 'Leading digital agency delivering exceptional marketing solutions that drive growth.',
    url: baseUrl,
    telephone: '+1-555-0123',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Marketing Street',
      addressLocality: 'Digital City',
      addressRegion: 'CA',
      postalCode: '94025',
      addressCountry: 'US',
    },
    areaServed: 'United States',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Digital Marketing Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Digital Strategy',
            description: 'Audience research, positioning, and campaign planning',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Web Design',
            description: 'Brand systems, web design, and creative that converts',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Growth Marketing',
            description: 'SEO, paid media, and analytics for measurable results',
          },
        },
      ],
    },
  }

  // JSON-LD structured data for WebSite
  const webSite: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Agency',
    description: 'Leading digital agency delivering exceptional marketing solutions that drive growth.',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusiness).replace(/</g, '\\u003c'),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSite).replace(/</g, '\\u003c'),
          }}
        />
      </head>
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
