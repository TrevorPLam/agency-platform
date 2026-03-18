import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { FeatureGrid } from '@agency/marketing'
import { Button } from '@agency/ui'

export default async function HomePage() {
  'use cache'

  cacheLife('days')
  cacheTag('page:home', 'page:marketing', 'site:firm')

  const features = [
    {
      title: 'Strategy',
      description:
        'Audience research, positioning, and campaign planning so your marketing is built on evidence, not guesswork.',
    },
    {
      title: 'Design',
      description:
        'Brand systems, web design, and creative that fits your voice and converts—without the generic look.',
    },
    {
      title: 'Growth',
      description: 'SEO, paid media, and analytics so you see what works and double down on it.',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            Strategy, design, and growth that scale
          </h1>
          <p className="mb-8 text-xl text-slate-600">
            We build and run digital marketing for brands that want clarity, creative quality, and
            measurable results.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/contact">Get in touch</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Our services</Link>
            </Button>
          </div>
        </div>

        <FeatureGrid features={features} className="mt-16" />
      </div>
    </main>
  )
}
