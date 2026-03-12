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
  const [{ data: posts, count: postCount }, { data: users }, { data: reports }] = await Promise.all([
    db.from('posts')
      .select('id, title, created_at, views_count, status, profiles!posts_author_id_fkey(username, display_name), categories!posts_category_id_fkey(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('profiles').select('id, username, display_name, created_at').order('created_at', { ascending: false }).limit(30),
    db.from('post_reports').select('id, reason, created_at, post_id, posts!post_reports_post_id_fkey(title), profiles!post_reports_user_id_fkey(username)').order('created_at', { ascending: false }).limit(20),
  ])

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
export interface AdminUser { id: string; username: string; display_name: string; created_at: string }
export interface AdminReport {
  id: string; reason: string; created_at: string; post_id: string
  posts: { title: string } | null
  profiles: { username: string } | null
}
