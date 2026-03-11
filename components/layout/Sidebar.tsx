import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SidebarClient from './SidebarClient'

interface Category { id: number; name: string; slug: string }
interface PopularPost { id: string; title: string; views_count: number }

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: catData } = await supabase.from('categories').select('*').order('id')
  const { data: postData } = await supabase
    .from('posts').select('id, title, views_count')
    .eq('status', 'published').order('views_count', { ascending: false }).limit(5)

  const categories = (catData ?? []) as unknown as Category[]
  const bestPosts = (postData ?? []) as unknown as PopularPost[]

  return <SidebarClient categories={categories} bestPosts={bestPosts} />
}
