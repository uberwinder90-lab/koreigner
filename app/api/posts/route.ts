import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const category = searchParams.get('category')
    const tab = searchParams.get('tab') ?? 'new'
    const offset = (page - 1) * limit

    const db = getAdminSupabase()
    let query = db
      .from('posts')
      .select(`
        id, title, content, created_at, views_count,
        profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
        categories!posts_category_id_fkey(id, name, slug),
        post_likes(count),
        comments(count)
      `, { count: 'exact' })
      .eq('status', 'published')

    if (category) {
      const { data: cat } = await db.from('categories').select('id').eq('slug', category).single()
      if (cat) query = query.eq('category_id', (cat as unknown as { id: number }).id)
    }

    query = tab === 'best'
      ? query.order('views_count', { ascending: false })
      : query.order('created_at', { ascending: false })

    const { data, count, error } = await query.range(offset, offset + limit - 1)
    if (error) throw error
    return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    console.error('GET /api/posts:', err)
    return NextResponse.json({ error: 'Failed to fetch posts.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Please log in to post.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, categoryId, embeddedUrl, mediaUrls } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: 'Category is required.' }, { status: 400 })

    const db = getAdminSupabase()

    // 2. Ensure profile exists (auto-create for OAuth / first-time users)
    const { data: profile } = await db.from('profiles').select('id').eq('id', user.id).single()
    if (!profile) {
      const emailBase = (user.email ?? 'user').split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user'
      const displayName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || emailBase

      let username = emailBase
      let attempt = 0
      while (true) {
        const candidate = attempt === 0 ? username : `${username}${attempt}`
        const { data: taken } = await db.from('profiles').select('id').eq('username', candidate).single()
        if (!taken) { username = candidate; break }
        if (++attempt > 99) { username = `user_${Date.now()}`; break }
      }

      const { error: profileErr } = await db.from('profiles').insert({
        id: user.id,
        username,
        display_name: String(displayName).slice(0, 50),
        profile_image_url: user.user_metadata?.avatar_url ?? null,
      } as never)

      if (profileErr) {
        console.error('[POST /api/posts] Profile auto-create failed:', profileErr.message)
        return NextResponse.json({
          error: `Profile setup failed: ${profileErr.message}. Please go to My Page to complete your profile.`
        }, { status: 500 })
      }
    }

    // 3. Create post
    const { data: post, error: postErr } = await db
      .from('posts')
      .insert({
        title: title.trim(),
        content: content?.trim() || null,
        author_id: user.id,
        category_id: Number(categoryId),
        embedded_url: embeddedUrl?.trim() || null,
        status: 'published',
      } as never)
      .select('id')
      .single()

    if (postErr || !post) {
      console.error('[POST /api/posts] Insert failed:', postErr?.message)
      return NextResponse.json({ error: postErr?.message ?? 'Post creation failed.' }, { status: 500 })
    }

    const postId = (post as unknown as { id: string }).id

    // 4. Save media
    if (mediaUrls?.length > 0) {
      const { error: mediaErr } = await db.from('post_media').insert(
        mediaUrls.map((url: string, i: number) => ({ post_id: postId, file_url: url, display_order: i })) as never
      )
      if (mediaErr) console.error('[POST /api/posts] Media insert failed:', mediaErr.message)
    }

    return NextResponse.json({ postId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts] Unexpected:', err)
    return NextResponse.json({ error: `Unexpected error: ${String(err)}` }, { status: 500 })
  }
}
