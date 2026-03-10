import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const path = `${user.id}/${timestamp}.${ext}`

    const bucket = file.type.startsWith('video/') ? 'videos' : 'images'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl, type: file.type.startsWith('video/') ? 'video' : 'image' })
  } catch (error) {
    console.error('upload error:', error)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
