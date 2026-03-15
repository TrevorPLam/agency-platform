import { ContactForm } from './contact-form'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with our agency. We would love to hear about your project.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Contact Us</h1>
          <p className="text-xl text-slate-600">
            Have a project in mind? Send us a message and we will get back to you.
          </p>
        </header>
        <ContactForm />
      </div>
    </main>
  )
}
