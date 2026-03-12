import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('comments')
    .select('id, content, created_at, parent_id, author_id, profiles!comments_author_id_fkey(id, username, display_name, profile_image_url)')
    .eq('post_id', postId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to comment.' }, { status: 401 })

  const { postId, content, parentId } = await request.json()
  if (!postId || !content?.trim()) return NextResponse.json({ error: 'postId and content required.' }, { status: 400 })

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('comments')
    .insert({ post_id: postId, author_id: user.id, content: content.trim(), parent_id: parentId ?? null, status: 'published' } as never)
    .select('id, content, created_at, parent_id, author_id, profiles!comments_author_id_fkey(id, username, display_name, profile_image_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = user.email === process.env.ADMIN_EMAIL

  const db = getAdminSupabase()
  const { data: comment } = await db.from('comments').select('author_id').eq('id', id).single()
  const c = comment as unknown as { author_id: string } | null
  if (!c || (!isAdmin && c.author_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.from('comments').update({ status: 'deleted' } as never).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = user.email === process.env.ADMIN_EMAIL

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const db = getAdminSupabase()
  const { data: comment } = await db.from('comments').select('author_id').eq('id', id).single()
  const c = comment as unknown as { author_id: string } | null
  if (!c || (!isAdmin && c.author_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await db.from('comments').update({ content: content.trim() } as never).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
