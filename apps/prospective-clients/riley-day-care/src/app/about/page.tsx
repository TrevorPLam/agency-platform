import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'About Us',
  description:
    'Learn about Riley Day Care and our commitment to quality early childhood education.',
}

export default function AboutPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">About Riley Day Care</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            We are committed to providing a safe, nurturing, and stimulating environment for every
            child.
          </p>
        </header>
        <section className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary space-y-2">
              <p>
                Riley Day Care exists to support families with high-quality early childhood care and
                education. We believe in learning through play, building strong relationships, and
                preparing children for a lifetime of success.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">What We Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-text-secondary list-inside list-disc space-y-2">
                <li>Licensed, experienced caregivers</li>
                <li>Age-appropriate curricula</li>
                <li>Safe, clean facilities</li>
                <li>Open communication with families</li>
                <li>Flexible scheduling options</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
