import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'Programs',
  description: 'Age-appropriate programs for infants through pre-K at Riley Day Care.',
}

export default function ProgramsPage() {
  const programs = [
    {
      title: 'Infants',
      age: '6 weeks – 12 months',
      description:
        'Safe, nurturing care with individualized schedules and early sensory experiences.',
    },
    {
      title: 'Toddlers',
      age: '1–2 years',
      description: 'Play-based learning and social development in a structured environment.',
    },
    {
      title: 'Preschool',
      age: '3–4 years',
      description: 'Pre-K readiness with literacy, math, and social-emotional skills.',
    },
  ]

  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Our Programs</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Age-appropriate programs designed to support growth and learning at every stage.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-1">
          {programs.map((program) => (
            <Card key={program.title}>
              <CardHeader>
                <CardTitle className="text-brand-primary">{program.title}</CardTitle>
                <p className="text-text-secondary text-sm">{program.age}</p>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">{program.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
