import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/post/PostCard'
import Sidebar from '@/components/layout/Sidebar'
import HomeHeader from '@/components/home/HomeHeader'

interface PostCardPost {
  id: string
  title: string
  content: string | null
  created_at: string
  views_count: number
  profiles: { username: string; display_name: string; profile_image_url: string | null } | null
  categories: { name: string; slug: string } | null
  post_likes: { count: number }[]
  comments: { count: number }[]
}

interface SearchParams { tab?: string; category?: string; page?: string }
interface Props { searchParams: Promise<SearchParams> }

const PER_PAGE = 20
const NEW_HOURS = 24
const HOT_VIEWS = 50

async function PostList({ tab, category, page }: { tab: string; category?: string; page: number }) {
  const supabase = await createClient()
  const offset = (page - 1) * PER_PAGE

  let query = supabase
    .from('posts')
    .select(`
      id, title, content, created_at, views_count,
      profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
      categories!posts_category_id_fkey(id, name, slug),
      post_likes(count),
      comments(count)
    `, { count: 'exact' })
    .eq('status', 'published')

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
    const catRow = cat as unknown as { id: number } | null
    if (catRow) query = query.eq('category_id', catRow.id)
  }

  query = tab === 'best'
    ? query.order('views_count', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, count } = await query.range(offset, offset + PER_PAGE - 1)
  const posts = (data ?? []) as unknown as PostCardPost[]
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)
  const now = Date.now()

  if (!posts.length) {
    return (
      <div className="card py-16 text-center">
        <div className="text-4xl mb-4">✍️</div>
        <p className="font-semibold mb-1" style={{ color: 'var(--text-2)' }}>아직 게시글이 없어요</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-4)' }}>첫 번째 게시글을 작성해 보세요!</p>
        <Link href="/submit" className="btn-primary">글쓰기</Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 mb-6">
        {posts.map((post) => {
          const hoursSince = (now - new Date(post.created_at).getTime()) / 3600000
          return (
            <PostCard
              key={post.id}
              post={post}
              isNew={hoursSince < NEW_HOURS}
              isBest={post.views_count >= HOT_VIEWS}
            />
          )
        })}
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-1.5">
          {page > 1 && (
            <Link href={`?tab=${tab}${category ? `&category=${category}` : ''}&page=${page - 1}`} className="btn-secondary px-3 py-2 text-sm">←</Link>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <Link
                key={p}
                href={`?tab=${tab}${category ? `&category=${category}` : ''}&page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${p === page ? 'btn-primary' : 'btn-secondary px-0 py-0'}`}
              >
                {p}
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={`?tab=${tab}${category ? `&category=${category}` : ''}&page=${page + 1}`} className="btn-secondary px-3 py-2 text-sm">→</Link>
          )}
        </nav>
      )}
    </>
  )
}

export default async function HomePage({ searchParams }: Props) {
  const { tab = 'new', category, page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  return (
    <div className="page-container py-8">
      <div className="flex gap-7">
        {/* Main */}
        <div className="flex-1 min-w-0">
          <HomeHeader tab={tab} category={category} />

          <Suspense
            key={`${tab}-${category}-${page}`}
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-xl" />
                ))}
              </div>
            }
          >
            <PostList tab={tab} category={category} page={page} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="skeleton h-52 rounded-xl" />
              <div className="skeleton h-40 rounded-xl" />
            </div>
          }>
            <Sidebar />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
