import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
]
const MAX_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인 (SSR 쿠키 클라이언트)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Please log in to upload files.' }, { status: 401 })
    }

    // 2. 파일 읽기
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 50MB limit.' }, { status: 400 })
    }

    // 3. 순수 Admin 클라이언트 생성 (RLS 완전 우회)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const ext = file.name.split('.').pop()?.toLowerCase() ||
      (file.type.includes('png') ? 'png' : file.type.includes('gif') ? 'gif' : 'jpg')
    const bucket = file.type.startsWith('video/') ? 'videos' : 'images'
    const path = `${user.id}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[upload] Supabase error:', uploadError.message, JSON.stringify(uploadError))

      if (uploadError.message?.toLowerCase().includes('bucket')) {
        return NextResponse.json({
          error: `Storage bucket "${bucket}" not found. Create it in Supabase Dashboard → Storage.`,
        }, { status: 500 })
      }
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: publicUrl, type: bucket === 'videos' ? 'video' : 'image' })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload] exception:', msg)
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
