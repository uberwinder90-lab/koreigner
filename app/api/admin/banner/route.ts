import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return user
}

export async function GET() {
  const db = getAdminSupabase()
  const { data, error } = await db
    .from('site_banners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const { title, subtitle, link_url, bg_color, text_color, is_active, is_popup } = body
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('site_banners')
    .insert({
      title: title.trim(),
      subtitle: subtitle?.trim() ?? null,
      link_url: link_url?.trim() ?? null,
      bg_color: bg_color ?? '#2563eb',
      text_color: text_color ?? '#ffffff',
      is_active: is_active ?? true,
      is_popup: !!is_popup,
    } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const db = getAdminSupabase()
  const { error } = await db.from('site_banners').update(body as never).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = getAdminSupabase()
  const { error } = await db.from('site_banners').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
