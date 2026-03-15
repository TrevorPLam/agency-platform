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

  const { data: postsData } = await supabase
    .from('posts')
    .select('id, title, slug')
    .order('created_at', { ascending: false })
    .limit(10)

  const posts: Array<{ id: string; title: string; slug: string }> = postsData ?? []

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
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-medium">Posts (tenant-scoped)</h2>
          {posts.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {posts.map((p) => (
                <li key={p.id}>
                  {p.title} <span className="text-muted-foreground">/{p.slug}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
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
