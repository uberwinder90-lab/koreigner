import { createClient } from '@/lib/supabase/server'
import SidebarClient from './SidebarClient'

interface PopularPost { id: string; title: string; views_count: number }

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: postData } = await supabase
    .from('posts').select('id, title, views_count')
    .eq('status', 'published').order('views_count', { ascending: false }).limit(5)

  const bestPosts = (postData ?? []) as unknown as PopularPost[]

  return <SidebarClient bestPosts={bestPosts} />
}
