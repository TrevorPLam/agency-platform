import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'Services',
  description: 'Strategy, design, and growth marketing services from our agency.',
}

const services = [
  {
    title: 'Strategy',
    description: 'Data-driven marketing strategies tailored to your business goals and audience.',
  },
  {
    title: 'Design',
    description: 'Creative design solutions that capture your brand essence and convert visitors.',
  },
  {
    title: 'Growth',
    description: 'Sustainable growth through optimized campaigns, SEO, and paid acquisition.',
  },
]

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Our services</h1>
          <p className="mx-auto max-w-2xl text-xl text-slate-600">
            From strategy and brand to campaigns and analytics—we cover the full stack so you can
            focus on your business.
          </p>
        </header>
        <section className="mx-auto grid max-w-3xl gap-6 md:grid-cols-1">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <CardTitle className="text-slate-900">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
