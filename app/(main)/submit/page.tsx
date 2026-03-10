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

  const { data: categories } = await supabase.from('categories').select('*').order('name')

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
