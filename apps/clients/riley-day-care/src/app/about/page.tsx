import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'About Us',
  description: 'Learn about Riley Day Care and our commitment to quality early childhood education.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">About Riley Day Care</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            We are committed to providing a safe, nurturing, and stimulating environment for every child.
          </p>
        </header>
        <section className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-text-secondary">
              <p>
                Riley Day Care exists to support families with high-quality early childhood care and education.
                We believe in learning through play, building strong relationships, and preparing children for a lifetime of success.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">What We Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
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
