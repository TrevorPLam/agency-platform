import Link from 'next/link'
import { Button } from '@agency/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-primary">
            The Barber Cave
          </h1>
          <p className="text-lg text-text-secondary">
            2629 N Stemmons Fwy STE 104, Dallas, TX 75207
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Cuts, fades, beard trims, and classic barber services
              </p>
              <Button asChild className="mt-4 bg-brand-primary hover:bg-brand-primary/90">
                <Link href="/services">View Services</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-accent">Book</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Schedule your appointment or walk in
              </p>
              <Button asChild className="mt-4 bg-brand-accent hover:bg-brand-accent/90">
                <Link href="/contact">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Visit Us</h2>
          <p className="text-text-secondary mb-4">2629 N Stemmons Fwy STE 104, Dallas, TX 75207</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild variant="outline" className="border-brand-primary text-brand-primary">
              <Link href="/contact">Book Appointment</Link>
            </Button>
            <Button asChild className="bg-brand-secondary hover:bg-brand-secondary/90">
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
