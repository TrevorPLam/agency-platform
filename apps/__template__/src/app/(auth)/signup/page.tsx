'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Button, Input, Label, cn } from '@agency/ui'
import { signupAction } from '@/app/(auth)/signup/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </Button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, null)

  return (
    <div className={cn('flex min-h-screen items-center justify-center p-4')}>
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
          <p className="text-muted-foreground text-xs">Minimum 12 characters</p>
        </div>
        <SubmitButton />
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="hover:text-foreground underline">
            Already have an account? Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
