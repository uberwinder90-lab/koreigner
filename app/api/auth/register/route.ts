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
      if (!verification) return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Username already taken. Please choose another.' }, { status: 409 })
    }

    // 이메일 중복 확인
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const emailTaken = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
    if (emailTaken) {
      return NextResponse.json({ error: 'Email already registered. Please sign in instead.' }, { status: 409 })
    }

    // Supabase Auth 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Registration failed.' }, { status: 500 })
    }

    // 프로필 upsert — 트리거가 이미 생성했을 수 있으므로 INSERT 대신 UPSERT 사용
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      username,
      display_name: displayName,
    }, { onConflict: 'id' })

    if (profileError) {
      // username 중복 (UNIQUE constraint)이면 auth user 삭제 후 오류 반환
      await supabase.auth.admin.deleteUser(authData.user.id)
      if (profileError.code === '23505') {
        return NextResponse.json({ error: 'Username already taken. Please choose another.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create profile. Please try again.' }, { status: 500 })
    }

    if (code && code !== 'direct') {
      await supabase.from('email_verifications').delete().eq('email', email)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('register error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
