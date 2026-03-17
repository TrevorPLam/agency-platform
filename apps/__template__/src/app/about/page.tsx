import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'About Us',
  description: 'Learn about TEMPLATE_NAME and our commitment to quality service.',
}

export default function AboutPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">About TEMPLATE_NAME</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            We are committed to providing exceptional service to every client.
          </p>
        </header>
        <section className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary space-y-2">
              <p>
                TEMPLATE_NAME exists to deliver high-quality professional services to our
                community. We believe in building strong relationships and creating lasting value
                for every client we serve.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">What We Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-text-secondary list-inside list-disc space-y-2">
                <li>Professional, experienced team</li>
                <li>Tailored solutions for your needs</li>
                <li>Clear communication throughout</li>
                <li>Commitment to quality results</li>
                <li>Flexible scheduling options</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
