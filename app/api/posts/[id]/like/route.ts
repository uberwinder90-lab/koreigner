import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminSupabase()
  const { data: existing } = await db.from('post_likes').select('post_id').eq('post_id', id).eq('user_id', user.id).single()

  if (existing) {
    await db.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
  } else {
    await db.from('post_likes').insert({ post_id: id, user_id: user.id } as never)
  }

  const { count } = await db.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', id)
  return NextResponse.json({ liked: !existing, count: count ?? 0 })
}
