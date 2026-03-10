import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
        categories!posts_category_id_fkey(id, name, slug),
        post_media(id, file_url, display_order),
        post_likes(count)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    const post = data as unknown as { views_count: number }
    supabase.from('posts').update({ views_count: post.views_count + 1 } as never).eq('id', id).then(() => {})

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch post.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content, categoryId, embeddedUrl, mediaUrls } = await request.json()

    const { data: existing } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    const existingPost = existing as unknown as { author_id: string } | null

    if (!existingPost || existingPost.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: content?.trim() ?? null,
        category_id: categoryId,
        embedded_url: embeddedUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)

    if (error) throw error

    if (mediaUrls !== undefined) {
      await supabase.from('post_media').delete().eq('post_id', id)
      if (mediaUrls.length > 0) {
        await supabase.from('post_media').insert(
          mediaUrls.map((url: string, i: number) => ({
            post_id: id,
            file_url: url,
            display_order: i,
          })) as never
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    const existingPost = existing as unknown as { author_id: string } | null

    if (!existingPost || existingPost.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await supabase.from('posts').update({ status: 'deleted' } as never).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 })
  }
}
