import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 6자리 코드 생성
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // 기존 코드 삭제 후 새 코드 저장
    await supabase.from('email_verifications').delete().eq('email', email)
    await supabase.from('email_verifications').insert({
      email,
      code,
      expires_at: expiresAt,
    } as never)

    // 이메일 발송 (Resend는 throw 대신 { error } 반환)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Koreigner — Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0284c7; margin-bottom: 16px;">Verify Your Email</h2>
          <p style="color: #52525b; margin-bottom: 24px;">
            Enter the code below to complete your registration. This code expires in 10 minutes.
          </p>
          <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0284c7;">${code}</span>
          </div>
          <p style="color: #71717a; font-size: 12px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend API error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('send-code error:', error)
    return NextResponse.json({ error: 'Failed to send verification code.' }, { status: 500 })
  }
}
