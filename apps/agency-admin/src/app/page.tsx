import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { Button, cn } from '@agency/ui'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  type PostRow = { id: string; title: string; slug: string; created_at: string }
  const postsList: PostRow[] = (posts ?? []) as PostRow[]

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-border-default flex min-h-96 items-center justify-center rounded-lg border-4 border-dashed p-8">
            <div className="animate-in fade-in text-center duration-300">
              <h1 className={cn('text-text-primary mb-4 text-2xl font-bold')}>
                Agency Admin Dashboard
              </h1>
              <p className={cn('text-text-secondary mb-6')}>
                Internal control panel for agency operations
              </p>
              <Button
                className={cn(
                  'bg-brand-primary text-text-inverse hover:bg-brand-primary/90 border-0'
                )}
              >
                Get Started
              </Button>
              {postsList.length > 0 && (
                <div className="mx-auto mt-8 max-w-md text-left">
                  <h2 className={cn('text-text-primary mb-2 font-semibold')}>Recent posts</h2>
                  <ul className="text-text-secondary list-inside list-disc space-y-1 text-sm">
                    {postsList.map((p) => (
                      <li key={p.id}>
                        {p.title} <span className="text-muted-foreground">/{p.slug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
