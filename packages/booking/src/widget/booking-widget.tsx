'use client'

import { useActionState } from 'react'
import type { BookingConfig } from '../types/config'
import { Button, Input, Label, cn } from '@agency/ui'

export type BookingSubmitAction = (
  _prev: { success: boolean; message?: string },
  formData: FormData
) => Promise<{ success: boolean; message?: string }>

export interface BookingWidgetProps {
  config: BookingConfig
  submitAction?: BookingSubmitAction
  className?: string
}

const initialState = { success: false, message: '' }

export function BookingWidget({ config, submitAction, className }: BookingWidgetProps) {
  const [state, formAction] = useActionState(
    submitAction ?? (() => Promise.resolve(initialState)),
    initialState
  )

  return (
    <div className={cn('space-y-4', className)} data-tenant-id={config.tenantId} data-widget="booking">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="booking-name">Name</Label>
          <Input id="booking-name" name="name" placeholder="Your name" className="w-full" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            id="booking-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking-message">Message (optional)</Label>
          <textarea
            id="booking-message"
            name="message"
            rows={3}
            placeholder="What would you like to discuss?"
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
        <Button type="submit">Request a Call</Button>
      </form>
    </div>
  )
}
