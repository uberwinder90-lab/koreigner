import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { timeAgo, getEmbedHtml } from '@/lib/utils'
import PostActions from './PostActions'
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

        {/* ── Main post card ── */}
        <article className="card overflow-hidden mb-4">
          {/* Post header bar */}
          <div className="px-4 py-3 flex items-center gap-2 text-xs flex-wrap" style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
            {/* Community */}
            {post.categories && (
              <Link
                href={`/?category=${post.categories.slug}`}
                className="flex items-center gap-1.5 font-bold hover:underline"
                style={{ color: 'var(--text-1)' }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>k</div>
                k/{post.categories.name}
              </Link>
            )}
            <span style={{ color: 'var(--text-4)' }}>•</span>
            <span style={{ color: 'var(--text-4)' }}>Posted by</span>
            {author && (
              <Link href={`/profile/${author.username}`} className="hover:underline font-medium" style={{ color: 'var(--text-3)' }}>
                u/{author.username}
              </Link>
            )}
            <span style={{ color: 'var(--text-4)' }}>{timeAgo(post.created_at)}</span>
          </div>

          <div className="p-4 sm:p-6">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-4" style={{ color: 'var(--text-1)' }}>
              {post.title}
            </h1>

            {/* Text content */}
            {post.content && (
              <div className="prose-content mb-5" dangerouslySetInnerHTML={{ __html: post.content }} />
            )}

            {/* Media gallery (attachments: Reddit-style large) */}
            {media.length > 0 && (
              <div className={`mb-5 space-y-4 ${media.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}`}>
                {media.map(m => {
                  const isVideo = /\.(mp4|webm|ogg)$/i.test(m.file_url)
                  return isVideo ? (
                    <figure key={m.id} className="post-inline-media">
                      <video src={m.file_url} controls className="w-full rounded-xl max-h-[70vh] object-contain"
                        style={{ background: '#000' }} />
                    </figure>
                  ) : (
                    <figure key={m.id} className="post-inline-media relative overflow-hidden rounded-xl w-full"
                      style={{ background: 'var(--bg-alt)', minHeight: '280px' }}>
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

            {/* Action bar (Reddit style) */}
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
        {(prevPost || nextPost) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              {prevPost ? (
                <Link href={`/post/${prevPost.id}`}
                  className="card p-3 flex items-start gap-2 hover:border-[var(--primary)] transition-colors group h-full"
                  style={{ color: 'var(--text-3)' }}>
                  <span className="mt-0.5 flex-shrink-0">←</span>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>Previous</p>
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {prevPost.title}
                    </p>
                  </div>
                </Link>
              ) : null}
            </div>
            <div>
              {nextPost ? (
                <Link href={`/post/${nextPost.id}`}
                  className="card p-3 flex items-start gap-2 justify-end text-right hover:border-[var(--primary)] transition-colors group h-full"
                  style={{ color: 'var(--text-3)' }}>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>Next</p>
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {nextPost.title}
                    </p>
                  </div>
                  <span className="mt-0.5 flex-shrink-0">→</span>
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        <div className="card p-5 sm:p-6">
          <CommentList postId={id} currentUser={user} />
        </div>
      </div>
    </div>
  )
}
