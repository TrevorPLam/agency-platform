import Link from 'next/link'
import { Button } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Strategy, design, and growth that scale
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            We build and run digital marketing for brands that want clarity, creative quality, and measurable results.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link href="/contact">Get in touch</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Our services</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Strategy</h3>
            <p className="text-slate-600">
              Audience research, positioning, and campaign planning so your marketing is built on evidence, not guesswork.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Design</h3>
            <p className="text-slate-600">
              Brand systems, web design, and creative that fits your voice and converts—without the generic look.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Growth</h3>
            <p className="text-slate-600">
              SEO, paid media, and analytics so you see what works and double down on it.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
