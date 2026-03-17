import Link from 'next/link'
import { Button } from '@agency/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl space-y-12 px-4 py-12">
        <header className="space-y-4 text-center">
          <h1 className="text-brand-primary text-4xl font-bold">Welcome to TEMPLATE_NAME</h1>
          <p className="text-text-secondary text-lg">
            Professional services tailored to your needs.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Our Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Explore the full range of services we offer.
              </p>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary/90 mt-4">
                <Link href="/services">Learn More</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-accent">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Ready to get started? Contact us today.
              </p>
              <Button asChild className="bg-brand-accent hover:bg-brand-accent/90 mt-4">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="mb-4 text-2xl font-semibold">Ready to Work Together?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline" className="border-brand-primary text-brand-primary">
              <Link href="/about">About Us</Link>
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
