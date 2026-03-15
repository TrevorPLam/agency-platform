import Link from 'next/link'
import { Button } from '@agency/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl space-y-12 px-4 py-12">
        <header className="space-y-4 text-center">
          <h1 className="text-brand-primary text-4xl font-bold">The Barber Cave</h1>
          <p className="text-text-secondary text-lg">
            2629 N Stemmons Fwy STE 104, Dallas, TX 75207
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Cuts, fades, beard trims, and classic barber services
              </p>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary/90 mt-4">
                <Link href="/services">View Services</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-accent">Book</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">Schedule your appointment or walk in</p>
              <Button asChild className="bg-brand-accent hover:bg-brand-accent/90 mt-4">
                <Link href="/contact">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="mb-4 text-2xl font-semibold">Visit Us</h2>
          <p className="text-text-secondary mb-4">2629 N Stemmons Fwy STE 104, Dallas, TX 75207</p>
          <div className="flex flex-wrap justify-center gap-4">
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
