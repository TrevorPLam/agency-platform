'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@agency/ui'
import { cn } from '@agency/ui'
import { submitContactForm } from './actions'

const initialState = { success: false, message: '' }

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState)

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Your name" className="w-full" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="w-full" />
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
            'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
          )}
        />
      </div>
      {state.message && (
        <p className={cn('text-sm', state.success ? 'text-green-600' : 'text-red-600')}>
          {state.message}
        </p>
      )}
      <Button type="submit">Send Message</Button>
    </form>
  )
}
