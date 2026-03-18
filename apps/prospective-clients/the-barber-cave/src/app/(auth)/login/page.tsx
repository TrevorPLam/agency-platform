'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Label, cn } from '@agency/ui'
import { loginAction } from '@/app/(auth)/login/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const callbackError = searchParams.get('error')
  const [state, formAction] = useActionState(loginAction, null)
  const visibleError = callbackError || state?.error

  return (
    <div className={cn('flex min-h-screen items-center justify-center p-4')}>
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <input type="hidden" name="redirect" value={redirect} />
        <h1 className="text-xl font-semibold">Sign in</h1>
        {visibleError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {visibleError}
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
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton />
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/signup" className="hover:text-foreground underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center p-4">Loading…</div>}
    >
      <LoginForm />
    </Suspense>
  )
}
