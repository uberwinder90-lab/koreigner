import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

    const { reason } = await request.json()
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Reason is required.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already reported.' }, { status: 409 })
    }

    await supabase.from('post_reports').insert({
      post_id: id,
      user_id: user.id,
      reason: reason.trim(),
    } as never)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('report error:', error)
    return NextResponse.json({ error: 'Failed.' }, { status: 500 })
  }
}
