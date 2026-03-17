import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'Services',
  description: 'Professional services offered by TEMPLATE_NAME.',
}

export default function ServicesPage() {
  const services = [
    {
      title: 'Consultation',
      description: 'Expert consultation to assess your needs and recommend the best approach.',
    },
    {
      title: 'Core Services',
      description: 'Our primary service offering, tailored to your specific requirements.',
    },
    {
      title: 'Ongoing Support',
      description: 'Continued assistance and follow-up to ensure your long-term success.',
    },
  ]

  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Our Services</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Professional services designed to meet your needs at every stage.
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
