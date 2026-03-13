import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return user
}

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { username, displayName, profileImageUrl } = body as {
    username?: string
    displayName?: string
    profileImageUrl?: string | null
  }

  const update: Record<string, unknown> = {}
  if (typeof username === 'string' && username.trim()) {
    update.username = username.trim().toLowerCase()
  }
  if (typeof displayName === 'string' && displayName.trim()) {
    update.display_name = displayName.trim()
  }
  if (profileImageUrl !== undefined) {
    update.profile_image_url = profileImageUrl || null
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const db = getAdminSupabase()
  const { error } = await db.from('profiles').update(update as never).eq('id', id)

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

