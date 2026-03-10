import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Google 가입 시 프로필이 없으면 자동 생성
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        const emailBase = data.user.email?.split('@')[0] ?? 'user'
        const username = emailBase.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user'

        // 유저네임 중복 방지: 겹치면 숫자 붙임
        let finalUsername = username
        let suffix = 1
        while (true) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', finalUsername)
            .single()
          if (!existing) break
          finalUsername = `${username}${suffix++}`
          if (suffix > 999) { finalUsername = `user${Date.now()}`; break }
        }

        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          emailBase

        const avatarUrl = data.user.user_metadata?.avatar_url || null

        await supabase.from('profiles').insert({
          id: data.user.id,
          username: finalUsername,
          display_name: String(displayName).slice(0, 50),
          profile_image_url: avatarUrl,
        } as never)
      }
    }

    const redirectUrl = new URL(next.startsWith('/') ? next : '/', url.origin)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(new URL('/', request.url))
}
