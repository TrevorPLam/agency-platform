import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { signOutAction } from '@/app/actions/auth'
import { Button } from '@agency/ui'

export async function HeaderAuth() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  )
}
