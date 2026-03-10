import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

    const { data: existing } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id)
      return NextResponse.json({ liked: false, count: count ?? 0 })
    } else {
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id } as never)
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id)
      return NextResponse.json({ liked: true, count: count ?? 0 })
    }
  } catch (error) {
    console.error('like error:', error)
    return NextResponse.json({ error: 'Failed.' }, { status: 500 })
  }
}
