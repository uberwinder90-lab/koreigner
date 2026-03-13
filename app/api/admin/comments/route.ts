import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('comments')
    .select(`
      id, content, created_at, status, author_id, post_id,
      profiles!comments_author_id_fkey(username, display_name),
      posts!comments_post_id_fkey(title, status)
    `)
    .neq('status', 'deleted')
    .eq('posts.status', 'published')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
