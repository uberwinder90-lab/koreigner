import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link' // used for author/embed links
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { getEmbedHtml } from '@/lib/utils'
import PostActions from './PostActions'
import PostMeta from './PostMeta'
import PostNav from './PostNav'
import CommentList from '@/components/comment/CommentList'

interface PostAuthor { id: string; username: string; display_name: string; profile_image_url: string | null }
interface PostCategory { id: number; name: string; slug: string }
interface PostMedia { id: string; file_url: string; display_order: number }
interface FullPost {
  id: string; title: string; content: string | null; author_id: string
  views_count: number; embedded_url: string | null; created_at: string; updated_at: string
  profiles: PostAuthor | null; categories: PostCategory | null
  post_media: PostMedia[]; post_likes: { count: number }[]
}
interface NavPost { id: string; title: string }
interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const db = getAdminSupabase()
  const { data } = await db.from('posts').select('title, content').eq('id', id).single()
  const p = data as unknown as { title: string; content: string | null } | null
  const desc = p?.content?.replace(/<[^>]+>/g, '').slice(0, 160) ?? ''
  return { title: p?.title ?? 'Post', description: desc }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const db = getAdminSupabase()

  const { data } = await db.from('posts')
    .select(`*, profiles!posts_author_id_fkey(*), categories!posts_category_id_fkey(*), post_media(*), post_likes(count)`)
    .eq('id', id).eq('status', 'published').single()

  if (!data) notFound()
  const post = data as unknown as FullPost

  // Increment views
  await db.from('posts').update({ views_count: (post.views_count ?? 0) + 1 } as never).eq('id', id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userLiked = false
  if (user) {
    const { data: likeData } = await db.from('post_likes').select('post_id').eq('post_id', id).eq('user_id', user.id).single()
    userLiked = !!likeData
  }

  const likesCount = post.post_likes?.[0]?.count ?? 0
  const embedHtml = post.embedded_url ? getEmbedHtml(post.embedded_url) : null
  const media = (post.post_media ?? []).sort((a, b) => a.display_order - b.display_order)
  const author = post.profiles

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    db.from('posts').select('id, title').eq('status', 'published').lt('created_at', post.created_at).order('created_at', { ascending: false }).limit(1).single(),
    db.from('posts').select('id, title').eq('status', 'published').gt('created_at', post.created_at).order('created_at', { ascending: true }).limit(1).single(),
  ])

  const prevPost = prevData as unknown as NavPost | null
  const nextPost = nextData as unknown as NavPost | null

  return (
    <div className="page-container py-6">
      <div className="max-w-3xl mx-auto">

        {/* Back button + post header meta (client: i18n + timeAgo) */}
        <PostMeta
          createdAt={post.created_at}
          authorUsername={author?.username ?? null}
          categorySlug={post.categories?.slug ?? null}
          categoryName={post.categories?.name ?? null}
        />

        {/* ── Main post card ── */}
        <article className="card overflow-hidden mt-3 mb-4">
          <div className="p-4 sm:p-6">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-5" style={{ color: 'var(--text-1)' }}>
              {post.title}
            </h1>

            {/* Author avatar */}
            {author && (
              <Link href={`/profile/${author.username}`} className="inline-flex items-center gap-2 mb-4 group">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
                  {author.profile_image_url ? (
                    <Image src={author.profile_image_url} alt={author.display_name} fill className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--primary)' }}>
                      {author.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-2)' }}>
                  {author.display_name}
                </span>
              </Link>
            )}

            {/* Text content */}
            {post.content && (
              <div className="prose-content mb-5" dangerouslySetInnerHTML={{ __html: post.content }} />
            )}

            {/* Media gallery */}
            {media.length > 0 && (
              <div className={`mb-5 ${media.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}`}>
                {media.map(m => {
                  const isVideo = /\.(mp4|webm|ogg)$/i.test(m.file_url)
                  return isVideo ? (
                    <figure key={m.id} className="post-inline-media">
                      <video src={m.file_url} controls className="w-full rounded-xl max-h-[70vh] object-contain" style={{ background: '#000' }} />
                    </figure>
                  ) : (
                    <figure key={m.id} className="post-inline-media relative overflow-hidden rounded-xl w-full" style={{ background: 'var(--bg-alt)', minHeight: '280px' }}>
                      <Image src={m.file_url} alt="Post image" fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
                    </figure>
                  )
                })}
              </div>
            )}

            {/* Embed */}
            {embedHtml ? (
              <div className="mb-5 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: embedHtml }} />
            ) : post.embedded_url ? (
              <a href={post.embedded_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--primary)' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate">{post.embedded_url}</span>
              </a>
            ) : null}

            {/* Action bar */}
            <PostActions
              postId={id}
              authorId={post.author_id}
              currentUserId={user?.id ?? null}
              initialLikesCount={likesCount}
              initialUserLiked={userLiked}
              viewsCount={post.views_count}
            />
          </div>
        </article>

        {/* ── Prev/Next navigation ── */}
        <PostNav prevPost={prevPost} nextPost={nextPost} />

        {/* ── Comments ── */}
        <div className="card p-5 sm:p-6">
          <CommentList postId={id} currentUser={user} />
        </div>
      </div>
    </div>
  )
}
