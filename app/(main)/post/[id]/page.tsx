import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { timeAgo, getEmbedHtml } from '@/lib/utils'
import PostActions from './PostActions'
import CommentList from '@/components/comment/CommentList'

interface PostAuthor {
  id: string
  username: string
  display_name: string
  profile_image_url: string | null
}

interface PostCategory {
  id: number
  name: string
  slug: string
}

interface PostMedia {
  id: string
  file_url: string
  display_order: number
}

interface FullPost {
  id: string
  title: string
  content: string | null
  author_id: string
  views_count: number
  embedded_url: string | null
  created_at: string
  updated_at: string
  profiles: PostAuthor | null
  categories: PostCategory | null
  post_media: PostMedia[]
  post_likes: { count: number }[]
}

interface NavPost {
  id: string
  title: string
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('title').eq('id', id).single()
  const post = data as unknown as { title: string } | null
  return { title: post?.title ?? 'Post' }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_author_id_fkey(id, username, display_name, profile_image_url),
      categories!posts_category_id_fkey(id, name, slug),
      post_media(id, file_url, display_order),
      post_likes(count)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!data) notFound()
  const post = data as unknown as FullPost

  // 조회수 증가
  await supabase
    .from('posts')
    .update({ views_count: (post.views_count ?? 0) + 1 } as never)
    .eq('id', id)

  const { data: { user } } = await supabase.auth.getUser()

  let userLiked = false
  if (user) {
    const { data: likeData } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()
    userLiked = !!likeData
  }

  const likesCount = post.post_likes?.[0]?.count ?? 0
  const embedHtml = post.embedded_url ? getEmbedHtml(post.embedded_url) : null
  const media = (post.post_media ?? []).sort((a, b) => a.display_order - b.display_order)
  const author = post.profiles

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title')
      .eq('status', 'published')
      .lt('created_at', post.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('posts')
      .select('id, title')
      .eq('status', 'published')
      .gt('created_at', post.created_at)
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  const prevPost = prevData as unknown as NavPost | null
  const nextPost = nextData as unknown as NavPost | null

  return (
    <div className="page-container py-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-5 flex-wrap" style={{ color: 'var(--text-4)' }}>
          <Link href="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
          <span>/</span>
          {post.categories && (
            <>
              <Link href={`/?category=${post.categories.slug}`} className="hover:text-[var(--primary)] transition-colors">
                {post.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="line-clamp-1" style={{ color: 'var(--text-3)' }}>{post.title}</span>
        </nav>

        {/* Post */}
        <article className="card p-6 sm:p-8 mb-4">
          {/* Category badge */}
          {post.categories && (
            <Link href={`/?category=${post.categories.slug}`} className="badge-category mb-3 inline-block">
              {post.categories.name}
            </Link>
          )}

          <h1 className="text-xl sm:text-2xl font-bold mb-5 leading-snug" style={{ color: 'var(--text-1)' }}>
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center justify-between mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
            {author && (
              <Link href={`/profile/${author.username}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0"
                  style={{ background: 'var(--primary-light)' }}>
                  {author.profile_image_url ? (
                    <Image src={author.profile_image_url} alt={author.display_name} fill className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                      style={{ color: 'var(--primary)' }}>
                      {author.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-[var(--primary)] transition-colors"
                    style={{ color: 'var(--text-1)' }}>
                    {author.display_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{timeAgo(post.created_at)}</p>
                </div>
              </Link>
            )}
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.views_count}
            </span>
          </div>

          {/* Content */}
          {post.content && (
            <div className="prose-content mb-6" dangerouslySetInnerHTML={{ __html: post.content }} />
          )}

          {/* Embedded URL */}
          {embedHtml ? (
            <div className="mb-6 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: embedHtml }} />
          ) : post.embedded_url ? (
            <a href={post.embedded_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 mb-6 p-3 rounded-lg text-sm hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-alt)', color: 'var(--primary)' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="break-all line-clamp-1">{post.embedded_url}</span>
            </a>
          ) : null}

          {/* Media Gallery */}
          {media.length > 0 && (
            <div className={`grid gap-3 mb-6 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {media.map((m) => {
                const isVideo = /\.(mp4|webm|ogg)$/i.test(m.file_url)
                return isVideo ? (
                  <video key={m.id} src={m.file_url} controls className="w-full rounded-xl" />
                ) : (
                  <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden">
                    <Image src={m.file_url} alt="" fill className="object-cover" />
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <PostActions
            postId={id}
            authorId={post.author_id}
            currentUserId={user?.id ?? null}
            initialLikesCount={likesCount}
            initialUserLiked={userLiked}
          />
        </article>

        {/* Prev / Next */}
        <div className="card p-4 mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            {prevPost ? (
              <Link href={`/post/${prevPost.id}`}
                className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
                style={{ color: 'var(--text-3)' }}>
                <span>←</span>
                <span className="line-clamp-1">{prevPost.title}</span>
              </Link>
            ) : <span className="text-xs" style={{ color: 'var(--text-4)' }}>No previous</span>}
          </div>
          <div className="text-right">
            {nextPost ? (
              <Link href={`/post/${nextPost.id}`}
                className="flex items-center justify-end gap-1.5 hover:text-[var(--primary)] transition-colors"
                style={{ color: 'var(--text-3)' }}>
                <span className="line-clamp-1">{nextPost.title}</span>
                <span>→</span>
              </Link>
            ) : <span className="text-xs" style={{ color: 'var(--text-4)' }}>No next</span>}
          </div>
        </div>

        {/* Comments */}
        <div className="card p-6 sm:p-8">
          <CommentList postId={id} currentUser={user} />
        </div>
      </div>
    </div>
  )
}
