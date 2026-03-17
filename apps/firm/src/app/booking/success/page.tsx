import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Booking Request Received',
  description: 'Your booking request has been successfully submitted. We\'ll be in touch soon.',
}

export default function BookingSuccessPage() {
  return (
    <main className="container mx-auto max-w-md px-4 py-12">
      <div className="text-center space-y-6">
        {/* Success indicator */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Booking Request Received!
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Thank you for your interest. We've received your booking request and will be in touch within 24 hours to schedule a call.
          </p>
        </div>

        {/* Next steps */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-left">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
            What happens next?
          </h2>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Our team reviews your booking request
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              We'll send available time slots within 24 hours
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              You can confirm your preferred time slot
            </li>
          </ul>
        </div>

        {/* CTA to return home */}
        <div className="space-y-3">
          <a
            href="/"
            className="inline-block w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Return to Homepage
          </a>
          <a
            href="/contact"
            className="inline-block w-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Contact Us Directly
          </a>
        </div>

        {/* Additional info */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Can't wait? You can also reach us directly at{' '}
          <a href="mailto:hello@agency.com" className="text-slate-700 dark:text-slate-300 underline">
            hello@agency.com
          </a>
        </p>
      </div>
    </main>
  )
}
