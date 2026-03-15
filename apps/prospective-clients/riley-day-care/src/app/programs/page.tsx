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
      description: 'Safe, nurturing care with individualized schedules and early sensory experiences.',
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
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">Our Programs</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Age-appropriate programs designed to support growth and learning at every stage.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-1">
          {programs.map((program) => (
            <Card key={program.title}>
              <CardHeader>
                <CardTitle className="text-brand-primary">{program.title}</CardTitle>
                <p className="text-sm text-text-secondary">{program.age}</p>
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
