'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@agency/ui'
import { cn } from '@agency/ui'
import { submitContactForm, type ContactFormState } from './actions'

const initialState: ContactFormState = { success: false, message: '', errors: {} }

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {/* Honeypot field - hidden from humans, visible to bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <Label htmlFor="website">Website (leave blank)</Label>
        <Input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          placeholder="Leave this field blank"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Your name"
          className="w-full"
          aria-invalid={state.errors?.name ? 'true' : 'false'}
        />
        {state.errors?.name && (
          <p className="text-sm text-red-600" role="alert">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full"
          aria-invalid={state.errors?.email ? 'true' : 'false'}
        />
        {state.errors?.email && (
          <p className="text-sm text-red-600" role="alert">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="How can we help?"
          className={cn(
            'flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none',
            state.errors?.message && 'border-red-600 focus-visible:ring-red-600'
          )}
          aria-invalid={state.errors?.message ? 'true' : 'false'}
        />
        {state.errors?.message && (
          <p className="text-sm text-red-600" role="alert">
            {state.errors.message}
          </p>
        )}
      </div>

      {state.message && (
        <p
          className={cn('text-sm', state.success ? 'text-green-600' : 'text-red-600')}
          role="status"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={state.success}>
        {state.success ? 'Sent' : 'Send Message'}
      </Button>
    </form>
  )
}
