import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await request.json()
  if (!reason?.trim()) return NextResponse.json({ error: 'Reason is required.' }, { status: 400 })

  const db = getAdminSupabase()
  const { error } = await db.from('post_reports').insert({ post_id: id, user_id: user.id, reason: reason.trim() } as never)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
