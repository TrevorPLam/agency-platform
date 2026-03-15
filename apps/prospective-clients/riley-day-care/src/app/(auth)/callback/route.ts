import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@agency/database'

/**
 * Auth callback: exchanges code for session (OAuth / email link).
 * Redirects to dashboard on success, to login on error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.redirect(new URL(next, request.url))
  const cookieStore = {
    getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet: Array<{ name: string; value: string; options?: object }>) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as { path?: string; maxAge?: number })
      )
    },
  }

  const supabase = createSupabaseServerClient(cookieStore)
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  return response
}
