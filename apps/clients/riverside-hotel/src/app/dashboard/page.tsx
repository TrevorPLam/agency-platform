import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { extractOriginalEmail } from '@agency/database'
import { Button } from '@agency/ui'
import { signOutAction } from '@/app/actions/auth'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  const tenantId = (user.app_metadata?.tenant_id as string) ?? null
  const displayEmail = user.email ? extractOriginalEmail(user.email) : user.email ?? '—'

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{displayEmail}</p>
          {tenantId && (
            <p className="text-sm text-muted-foreground">
              Tenant ID: <code className="rounded bg-muted px-1">{tenantId}</code>
            </p>
          )}
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
