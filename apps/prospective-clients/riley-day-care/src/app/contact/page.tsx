import { ContactForm } from './contact-form'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Riley Day Care. Schedule a tour or ask about enrollment.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">Contact Us</h1>
          <p className="text-lg text-text-secondary">
            Have questions or want to schedule a tour? Send us a message and we&apos;ll get back to you soon.
          </p>
        </header>
        <section>
          <ContactForm />
        </section>
        <section className="mt-12 pt-8 border-t border-border-primary">
          <h2 className="text-xl font-semibold text-brand-primary mb-2">Visit or Call</h2>
          <p className="text-text-secondary">123 Care Lane, Your City, ST 12345</p>
          <p className="text-text-secondary mt-1">(555) 123-4567</p>
        </section>
      </div>
    </main>
  )
}
