'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, cn } from '@agency/ui'
import { createSupabaseBrowserClient } from '@agency/database'
import { signupAction } from '@/app/actions/auth'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signupAction(email, password)
      if (!result.success) {
        setError(result.error ?? 'Signup failed')
        return
      }
      if (result.authEmail) {
        const supabase = createSupabaseBrowserClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.authEmail,
          password,
        })
        if (signInError) {
          setError(signInError.message)
          return
        }
      }
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4')}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Minimum 12 characters</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <a href="/login" className="underline hover:text-foreground">
            Already have an account? Sign in
          </a>
        </p>
      </form>
    </div>
  )
}
