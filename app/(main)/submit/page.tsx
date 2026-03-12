import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmitForm from './SubmitForm'

interface Props {
  searchParams: Promise<{ edit?: string }>
}

export async function generateMetadata({ searchParams }: Props) {
  const { edit } = await searchParams
  return { title: edit ? 'Edit Post' : 'Write Post' }
}

export default async function SubmitPage({ searchParams }: Props) {
  const { edit } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/submit')

  // Only show the 5 canonical categories (filter out any old/legacy DB entries)
  const VALID_SLUGS = ['free', 'jobs', 'realestate', 'marketplace', 'info']
  const { data: rawCats } = await supabase
    .from('categories')
    .select('*')
    .in('slug', VALID_SLUGS)
    .order('id')

  // Fallback: if DB not yet migrated, use hardcoded list so the form always works
  const FALLBACK_CATEGORIES = [
    { id: 1, name: 'Community',   slug: 'free' },
    { id: 2, name: 'Jobs',        slug: 'jobs' },
    { id: 3, name: 'House',       slug: 'realestate' },
    { id: 4, name: 'Marketplace', slug: 'marketplace' },
    { id: 5, name: 'Information', slug: 'info' },
  ]
  const categories = (rawCats && rawCats.length > 0) ? rawCats : FALLBACK_CATEGORIES

  let editPost = null
  if (edit) {
    const { data: post } = await supabase
      .from('posts')
      .select('*, post_media(id, file_url, display_order)')
      .eq('id', edit)
      .eq('author_id', user.id)
      .eq('status', 'published')
      .single()

    if (!post) redirect('/')
    editPost = post
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto">
        <SubmitForm
          categories={categories ?? []}
          editPost={editPost}
        />
      </div>
    </div>
  )
}
