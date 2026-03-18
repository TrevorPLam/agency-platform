'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'

export async function signOutAction() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        if (options) {
          cookieStore.set(name, value, options)
          return
        }

        cookieStore.set(name, value)
      })
    },
  })
  await supabase.auth.signOut()
  redirect('/login')
}
