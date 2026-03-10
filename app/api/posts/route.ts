import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const category = searchParams.get('category')
    const tab = searchParams.get('tab') ?? 'new'
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('posts')
      .select(`
        id, title, content, created_at, updated_at, views_count, embedded_url, status,
        author_id,
        profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
        categories!posts_category_id_fkey(id, name, slug),
        post_likes(count),
        comments(count)
      `, { count: 'exact' })
      .eq('status', 'published')

    if (category) {
      query = query.eq('categories.slug', category)
    }

    if (tab === 'best') {
      query = query.order('views_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)
    if (error) throw error

    return NextResponse.json({
      posts: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content, categoryId, embeddedUrl, mediaUrls } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 })
    }

    const { data: postData, error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content: content?.trim() ?? null,
        author_id: user.id,
        category_id: categoryId,
        embedded_url: embeddedUrl?.trim() || null,
        status: 'published',
      } as never)
      .select('id')
      .single()

    if (error || !postData) throw error

    const post = postData as unknown as { id: string }

    if (mediaUrls && mediaUrls.length > 0) {
      await supabase.from('post_media').insert(
        mediaUrls.map((url: string, i: number) => ({
          post_id: post.id,
          file_url: url,
          display_order: i,
        })) as never
      )
    }

    return NextResponse.json({ postId: post.id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 })
  }
}
