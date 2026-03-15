import { ContactForm } from './contact-form'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Riley Day Care. Schedule a tour or ask about enrollment.',
}

export default function ContactPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Contact Us</h1>
          <p className="text-text-secondary text-lg">
            Have questions or want to schedule a tour? Send us a message and we&apos;ll get back to
            you soon.
          </p>
        </header>
        <section>
          <ContactForm />
        </section>
        <section className="border-border-primary mt-12 border-t pt-8">
          <h2 className="text-brand-primary mb-2 text-xl font-semibold">Visit or Call</h2>
          <p className="text-text-secondary">123 Care Lane, Your City, ST 12345</p>
          <p className="text-text-secondary mt-1">(555) 123-4567</p>
        </section>
      </div>
    </main>
  )
}
