import { ContactForm } from './contact-form'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with The Barber Cave. Book an appointment or walk in at Dallas, TX.',
}

export default function ContactPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Contact Us</h1>
          <p className="text-text-secondary text-lg">
            Book your appointment or ask a question. We&apos;re at 2629 N Stemmons Fwy STE 104,
            Dallas, TX 75207. Walk-ins welcome.
          </p>
        </header>
        <section>
          <ContactForm />
        </section>
        <section className="border-border-primary mt-12 border-t pt-8">
          <h2 className="text-brand-primary mb-2 text-xl font-semibold">Visit Us</h2>
          <p className="text-text-secondary">2629 N Stemmons Fwy STE 104, Dallas, TX 75207</p>
        </section>
      </div>
    </main>
  )
}
