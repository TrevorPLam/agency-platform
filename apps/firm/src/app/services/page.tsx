import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { getAllServices } from '@/content/services'

export const metadata = {
  title: 'Services',
  description: 'Strategy, design, and growth marketing services from our agency.',
}

export default async function ServicesPage() {
  const services = await getAllServices()

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
        <section className="mx-auto grid max-w-5xl gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-slate-900">{service.title}</CardTitle>
                <p className="text-slate-600">{service.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                {service.features && service.features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 font-semibold text-slate-900">Key Features</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="bg-brand-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full"></span>
                          <div>
                            <strong className="text-slate-900">{feature.title}</strong>
                            <p className="text-slate-600">{feature.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {service.pricing && (
                  <div className="mb-6 rounded-lg bg-slate-50 p-4">
                    <h4 className="mb-2 font-semibold text-slate-900">Pricing</h4>
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {service.pricing.startingAt}
                      </span>
                      <span className="text-sm text-slate-500">
                        /{service.pricing.model.toLowerCase()}
                      </span>
                    </p>
                    {service.pricing.notes && (
                      <p className="mt-1 text-xs text-slate-500">{service.pricing.notes}</p>
                    )}
                  </div>
                )}

                {service.process && service.process.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Our Process</h4>
                    <div className="space-y-3">
                      {service.process.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="bg-brand-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                            {step.step}
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900">{step.title}</h5>
                            <p className="text-sm text-slate-600">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
