import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const db = getAdminSupabase()
      const userId = data.user.id

      // Check if profile exists
      const { data: existing } = await db.from('profiles').select('id').eq('id', userId).single()

      if (!existing) {
        // Auto-create profile for OAuth users (Google, etc.)
        const emailBase = (data.user.email ?? 'user').split('@')[0]
          .replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user'
        const displayName = data.user.user_metadata?.full_name
          || data.user.user_metadata?.name
          || emailBase

        // Find unique username
        let username = emailBase
        let attempt = 0
        while (true) {
          const candidate = attempt === 0 ? username : `${username}${attempt}`
          const { data: taken } = await db.from('profiles').select('id').eq('username', candidate).single()
          if (!taken) { username = candidate; break }
          if (++attempt > 99) { username = `user_${Date.now()}`; break }
        }

        const { error: insertErr } = await db.from('profiles').insert({
          id: userId,
          username,
          display_name: String(displayName).slice(0, 50),
          profile_image_url: data.user.user_metadata?.avatar_url ?? null,
        } as never)

        if (insertErr) {
          console.error('[auth/callback] Profile creation failed:', insertErr.message)
        }
      }
    }
  }

  const redirectTo = new URL(next.startsWith('/') ? next : '/', url.origin)
  return NextResponse.redirect(redirectTo)
}
