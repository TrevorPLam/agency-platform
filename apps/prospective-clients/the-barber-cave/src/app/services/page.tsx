import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { REVALIDATE_CONTENT } from '@/lib/cache-config'

export const metadata = {
  title: 'Services',
  description: 'Cuts, fades, beard trims, and classic barber services at The Barber Cave in Dallas.',
}

export const revalidate = REVALIDATE_CONTENT

const services = [
  {
    title: 'Haircuts',
    description: 'Precision cuts and fades for every style. From classic to modern, we deliver sharp results.',
  },
  {
    title: 'Beard Trims',
    description: 'Expert beard shaping and maintenance. Keep your look clean and defined.',
  },
  {
    title: 'Hot Towel Service',
    description: 'Traditional hot towel treatment for the full barber experience.',
  },
  {
    title: 'Walk-ins Welcome',
    description: 'No appointment? No problem. Stop by 2629 N Stemmons Fwy STE 104, Dallas, TX 75207.',
  },
]

export default function ServicesPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Our Services</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Cuts, fades, beard trims, and classic barber services. Visit us at 2629 N Stemmons Fwy
            STE 104, Dallas, TX 75207.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-1">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <CardTitle className="text-brand-primary">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
