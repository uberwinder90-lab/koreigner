import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/post/PostCard'
import Sidebar from '@/components/layout/Sidebar'
interface PostCardPost {
  id: string
  title: string
  content: string | null
  created_at: string
  views_count: number
  profiles: {
    username: string
    display_name: string
    profile_image_url: string | null
  } | null
  categories: {
    name: string
    slug: string
  } | null
  post_likes: { count: number }[]
  comments: { count: number }[]
}

interface SearchParams {
  tab?: string
  category?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

const POSTS_PER_PAGE = 20
const NEW_POST_THRESHOLD_HOURS = 24
const BEST_VIEWS_THRESHOLD = 100

async function PostList({ tab, category, page }: { tab: string; category?: string; page: number }) {
  const supabase = await createClient()
  const offset = (page - 1) * POSTS_PER_PAGE

  let query = supabase
    .from('posts')
    .select(`
      id, title, content, created_at, updated_at, views_count,
      author_id,
      profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
      categories!posts_category_id_fkey(id, name, slug),
      post_likes(count),
      comments(count)
    `, { count: 'exact' })
    .eq('status', 'published')

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
    const catData = cat as unknown as { id: number } | null
    if (catData) query = query.eq('category_id', catData.id)
  }

  if (tab === 'best') {
    query = query.order('views_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query.range(offset, offset + POSTS_PER_PAGE - 1)
  const posts = (data ?? []) as unknown as PostCardPost[]
  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE)
  const now = Date.now()

  return (
    <>
      <div className="space-y-2 mb-6">
        {posts.length > 0 ? (
          posts.map((post) => {
            const hoursSince = (now - new Date(post.created_at).getTime()) / 3600000
            const isNew = hoursSince < NEW_POST_THRESHOLD_HOURS
            const isBest = post.views_count >= BEST_VIEWS_THRESHOLD
            return (
              <PostCard
                key={post.id}
                post={post}
                isNew={isNew}
                isBest={isBest}
              />
            )
          })
        ) : (
          <div className="card p-12 text-center text-text-tertiary">
            <p className="text-lg mb-1">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?tab=${tab}${category ? `&category=${category}` : ''}&page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors
                ${p === page
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100'
                }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}

export default async function HomePage({ searchParams }: Props) {
  const { tab = 'new', category, page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  return (
    <div className="page-container py-6">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-text-primary">Community</h1>
            <Link href="/submit" className="btn-primary text-xs px-3 py-1.5">
              + Write Post
            </Link>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-0 mb-4 border-b border-border">
            {(['new', 'best'] as const).map((t) => (
              <Link
                key={t}
                href={`?tab=${t}${category ? `&category=${category}` : ''}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
              >
                {t === 'new' ? 'New' : 'Best'}
              </Link>
            ))}
          </div>

          {/* Post List */}
          <Suspense
            key={`${tab}-${category}-${page}`}
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />
                ))}
              </div>
            }
          >
            <PostList tab={tab} category={category} page={page} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={<div className="space-y-4"><div className="card h-40 animate-pulse bg-gray-100" /></div>}>
            <Sidebar />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
