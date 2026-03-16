'use client'

import { useActionState } from 'react'
import { Button, Input, Label, cn } from '@agency/ui'
import { submitContactForm } from './actions'

const initialState = { success: false, message: '' }

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Your name" className="w-full" />
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
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="Book a cut or ask a question..."
          className={cn(
            'border-input bg-background ring-offset-background flex w-full rounded-md border px-3 py-2 text-sm',
            'placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2'
          )}
        />
      </div>
      {state.message && (
        <p className={cn('text-sm', state.success ? 'text-green-600' : 'text-red-600')}>
          {state.message}
        </p>
      )}
      <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">
        Send Message
      </Button>
    </form>
  )
}
