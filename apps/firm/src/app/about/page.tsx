import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'About',
  description: 'Learn about our agency and our approach to digital marketing.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">About us</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We are a digital marketing agency built around strategy, design, and measurable growth for ambitious brands.
          </p>
        </header>
        <section className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Our mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                We help businesses grow through data-driven strategy, clear creative, and campaigns that are built to measure. Our work is judged by the results that matter to your bottom line.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">What we do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>Brand and campaign strategy</li>
                <li>Web and creative design</li>
                <li>SEO and content marketing</li>
                <li>Paid media and analytics</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
