import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin — Koreigner' }

export default async function AdminPage() {
  // ── Auth check ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/')

  const db = getAdminSupabase()

  // ── Load data ──
  const [{ data: posts, count: postCount }, { data: users }, { data: rawReports }] = await Promise.all([
    db.from('posts')
      .select('id, title, created_at, views_count, status, profiles!posts_author_id_fkey(username, display_name), categories!posts_category_id_fkey(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('profiles').select('id, username, display_name, profile_image_url, created_at').order('created_at', { ascending: false }).limit(30),
    db.from('post_reports').select('id, reason, created_at, post_id, user_id').order('created_at', { ascending: false }).limit(20),
  ])

  // Enrich reports with post title and reporter username
  const reports: AdminReport[] = await Promise.all(
    (rawReports ?? []).map(async (r) => {
      const rep = r as { id: string; reason: string; created_at: string; post_id: string; user_id: string }
      const [{ data: post }, { data: reporter }] = await Promise.all([
        db.from('posts').select('title').eq('id', rep.post_id).single(),
        db.from('profiles').select('username').eq('id', rep.user_id).single(),
      ])
      return {
        id: rep.id,
        reason: rep.reason,
        created_at: rep.created_at,
        post_id: rep.post_id,
        posts: post as { title: string } | null,
        profiles: reporter as { username: string } | null,
      }
    })
  )

  return (
    <AdminClient
      posts={(posts ?? []) as AdminPost[]}
      postCount={postCount ?? 0}
      users={(users ?? []) as AdminUser[]}
      reports={(reports ?? []) as AdminReport[]}
    />
  )
}

export interface AdminPost {
  id: string; title: string; created_at: string; views_count: number; status: string
  profiles: { username: string; display_name: string } | null
  categories: { name: string; slug: string } | null
}
export interface AdminUser { id: string; username: string; display_name: string; profile_image_url: string | null; created_at: string }
export interface AdminReport {
  id: string; reason: string; created_at: string; post_id: string
  posts: { title: string } | null
  profiles: { username: string } | null
}
