import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const db = getAdminSupabase()
  const { data, error } = await db
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(*), categories!posts_category_id_fkey(*), post_media(*), post_likes(count)')
    .eq('id', id).eq('status', 'published').single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.from('posts').update({ views_count: ((data as unknown as { views_count: number }).views_count ?? 0) + 1 } as never).eq('id', id)
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = user.email === process.env.ADMIN_EMAIL

  const db = getAdminSupabase()
  const { data: existing } = await db.from('posts').select('author_id').eq('id', id).single()
  const post = existing as unknown as { author_id: string } | null
  if (!post || (!isAdmin && post.author_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, categoryId, embeddedUrl, mediaUrls } = await request.json()

  const { error } = await db.from('posts').update({
    title: title?.trim(),
    content: content?.trim() || null,
    category_id: categoryId ? Number(categoryId) : undefined,
    embedded_url: embeddedUrl?.trim() || null,
    updated_at: new Date().toISOString(),
  } as never).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (mediaUrls !== undefined) {
    await db.from('post_media').delete().eq('post_id', id)
    if (mediaUrls.length > 0) {
      await db.from('post_media').insert(
        mediaUrls.map((url: string, i: number) => ({ post_id: id, file_url: url, display_order: i })) as never
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = user.email === process.env.ADMIN_EMAIL

  const db = getAdminSupabase()
  const { data: existing } = await db.from('posts').select('author_id').eq('id', id).single()
  const post = existing as unknown as { author_id: string } | null
  if (!post || (!isAdmin && post.author_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.from('posts').update({ status: 'deleted' } as never).eq('id', id)
  return NextResponse.json({ success: true })
}
