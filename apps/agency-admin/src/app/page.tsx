import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { Button, cn } from '@agency/ui'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    },
  })

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const postsList = posts ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-border-default rounded-lg min-h-96 flex items-center justify-center p-8">
            <div className="text-center animate-in fade-in duration-300">
              <h1 className={cn('text-2xl font-bold text-text-primary mb-4')}>
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
                <div className="mt-8 text-left max-w-md mx-auto">
                  <h2 className={cn('font-semibold text-text-primary mb-2')}>
                    Recent posts
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
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
