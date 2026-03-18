import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { Inter } from 'next/font/google'
import { SiteProviders } from '@agency/marketing/providers'
import { SiteShell } from '@agency/marketing/shell'
import { LocalBusiness, SearchAction, WithContext, WebSite } from 'schema-dts'
import './globals.css'
import { siteConfig } from '../config/site'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000'
  ),
  title: { default: 'Agency — Digital Marketing Excellence', template: '%s | Agency' },
  description:
    'Leading digital agency delivering exceptional marketing solutions that drive growth.',
  openGraph: {
    title: 'Agency — Digital Marketing Excellence',
    description: 'Leading digital agency delivering exceptional marketing solutions.',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  'use cache'

  cacheLife('days')
  cacheTag('site-shell', `site-shell:${siteConfig.slug}`)

  const vercelUrl = process.env['VERCEL_URL']
  const baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'

  // JSON-LD structured data for LocalBusiness
  const localBusiness: WithContext<LocalBusiness> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Agency',
    description:
      'Leading digital agency delivering exceptional marketing solutions that drive growth.',
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
  const searchAction: SearchAction = {
    '@type': 'SearchAction',
    target: `${baseUrl}/search?q={search_term_string}`,
    query: 'required name=search_term_string',
  }

  const webSite: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Agency',
    description:
      'Leading digital agency delivering exceptional marketing solutions that drive growth.',
    url: baseUrl,
    potentialAction: searchAction,
  }

  return (
    <html lang="en" className={inter.variable} data-theme={siteConfig.slug}>
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
        <SiteProviders tenantSlug={siteConfig.slug}>
          <SiteShell config={siteConfig}>{children}</SiteShell>
        </SiteProviders>
      </body>
    </html>
  )
}
