import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = await createServiceClient()

    // 게시글 status를 deleted로 소프트 삭제
    await service.from('posts').update({ status: 'deleted' } as never).eq('author_id', user.id)

    // 프로필 삭제
    await service.from('profiles').delete().eq('id', user.id)

    // Auth 계정 삭제
    await service.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('delete account error:', error)
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }
}
