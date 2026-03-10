import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId required.' }, { status: 400 })

    const supabase = await createClient()
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_author_id_fkey(id, username, display_name, profile_image_url)
      `)
      .eq('post_id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(comments ?? [])
  } catch (error) {
    console.error('GET /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

    const { postId, content, parentId } = await request.json()

    if (!postId) return NextResponse.json({ error: 'postId required.' }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: 'Content required.' }, { status: 400 })
    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 chars).' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parentId ?? null,
        status: 'published',
      } as never)
      .select(`
        *,
        profiles!comments_author_id_fkey(id, username, display_name, profile_image_url)
      `)
      .single()

    if (error || !comment) throw error
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('POST /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to post comment.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: commentData } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', id)
      .single()

    const comment = commentData as unknown as { author_id: string } | null

    if (!comment || comment.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await supabase.from('comments').update({ status: 'deleted' } as never).eq('id', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/comments error:', error)
    return NextResponse.json({ error: 'Failed.' }, { status: 500 })
  }
}
