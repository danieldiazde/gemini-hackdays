import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    console.log('[auth/callback] usuario autenticado:', data.user?.email)
    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('[auth/callback] unexpected:', err)
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}
