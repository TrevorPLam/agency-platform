import Link from 'next/link'
import { Button } from '@agency/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-primary">
            Welcome to Riley Day Care
          </h1>
          <p className="text-lg text-text-secondary">
            Quality child care and early learning in a safe, nurturing environment
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Age-appropriate programs for infants through pre-K
              </p>
              <Button asChild className="mt-4 bg-brand-primary hover:bg-brand-primary/90">
                <Link href="/programs">Learn More</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-accent">Enroll</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Schedule a visit or start the enrollment process
              </p>
              <Button asChild className="mt-4 bg-brand-accent hover:bg-brand-accent/90">
                <Link href="/contact">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Visit Us</h2>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild variant="outline" className="border-brand-primary text-brand-primary">
              <Link href="/contact">Schedule a Tour</Link>
            </Button>
            <Button asChild className="bg-brand-secondary hover:bg-brand-secondary/90">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
