'use client'

import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  async function handleLogin() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('[login] OAuth error:', error.message)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[--color-bg]">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-[--color-border] bg-[--color-panel] p-10 shadow-xl">
        <h1 className="text-2xl font-semibold text-[--color-fg]">TecCoach</h1>
        <p className="text-sm text-[--color-fg-dim]">
          Inicia sesión para continuar
        </p>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 rounded-md bg-[--color-accent] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[--color-accent-hi]"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </main>
  )
}
