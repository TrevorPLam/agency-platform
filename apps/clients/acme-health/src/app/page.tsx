import { Button } from '@agency/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-primary">
            Welcome to Acme Health
          </h1>
          <p className="text-lg text-text-secondary">
            Your experience starts here
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">Premium Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Elegant rooms with stunning views and modern amenities
              </p>
              <Button className="mt-4 bg-brand-primary hover:bg-brand-primary/90">
                Book Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-accent">Fine Dining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Award-winning cuisine with local and international flavors
              </p>
              <Button className="mt-4 bg-brand-accent hover:bg-brand-accent/90">
                Reserve Table
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Experience Excellence</h2>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="border-brand-primary text-brand-primary">
              Virtual Tour
            </Button>
            <Button className="bg-brand-secondary hover:bg-brand-secondary/90">
              Contact Us
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
