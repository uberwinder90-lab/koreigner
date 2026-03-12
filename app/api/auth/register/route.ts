import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface VerificationRow {
  email: string
  code: string
  expires_at: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName, code } = await request.json()

    if (!email || !password || !username || !displayName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters (letters, numbers, underscores only).' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // 이메일 인증코드 확인 — 'direct'이면 건너뜀
    if (code && code !== 'direct') {
      const { data: verData } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .single()

      const verification = verData as unknown as VerificationRow | null

      if (!verification) {
        return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
      }
      if (new Date(verification.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 })
      }
    }

    // 유저네임 중복 확인
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })
    }

    // 이메일 중복 확인
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some(u => u.email === email)
    if (emailTaken) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    // Supabase Auth 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError?.message ?? 'Registration failed.' }, { status: 500 })
    }

    // 프로필 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username,
      display_name: displayName,
    } as never)

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
    }

    // 인증코드 정리 (있을 경우)
    if (code && code !== 'direct') {
      await supabase.from('email_verifications').delete().eq('email', email)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('register error:', error)
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}
