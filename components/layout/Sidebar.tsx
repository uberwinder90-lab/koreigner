import { getAdminSupabase } from '@/lib/supabase/admin'
import SidebarClient from './SidebarClient'

interface PopularPost { id: string; title: string; views_count: number }
interface SiteBanner { id: string; title: string; subtitle: string | null; link_url: string | null; bg_color: string; text_color: string; is_popup: boolean }

export default async function Sidebar() {
  const db = getAdminSupabase()
  const [{ data: postData }, bannerResult] = await Promise.all([
    db.from('posts').select('id, title, views_count')
      .eq('status', 'published').order('views_count', { ascending: false }).limit(5),
    db.from('site_banners').select('id, title, subtitle, link_url, bg_color, text_color, is_popup')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(3),
  ])

  const bestPosts = (postData ?? []) as unknown as PopularPost[]
  // site_banners 테이블이 아직 없으면 빈 배열 반환 (마이그레이션 전 방어)
  const banners = (bannerResult.error ? [] : (bannerResult.data ?? [])) as unknown as SiteBanner[]

  return <SidebarClient bestPosts={bestPosts} banners={banners} />
}
