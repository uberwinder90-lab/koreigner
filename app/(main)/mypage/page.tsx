import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MypageClient from './MypageClient'

export const metadata = { title: 'My Page' }

interface Profile {
  id: string
  username: string
  display_name: string
  profile_image_url: string | null
  created_at: string
}

export default async function MypagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/mypage')

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data) redirect('/login')
  const profile = data as unknown as Profile

  return <MypageClient user={user} profile={profile} />
}
