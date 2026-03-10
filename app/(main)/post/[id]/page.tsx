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
    <div className="page-container py-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-4">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          {post.categories && (
            <>
              <Link
                href={`/?category=${post.categories.slug}`}
                className="hover:text-primary transition-colors"
              >
                {post.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-text-secondary line-clamp-1">{post.title}</span>
        </nav>

        {/* Post */}
        <article className="card p-6 mb-4">
          <h1 className="text-xl font-bold text-text-primary mb-4">{post.title}</h1>

          {/* Author */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              {author && (
                <Link href={`/profile/${author.username}`} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-light relative">
                    {author.profile_image_url ? (
                      <Image src={author.profile_image_url} alt={author.display_name} fill className="object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary flex items-center justify-center w-full h-full">
                        {author.display_name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {author.display_name}
                    </p>
                    <p className="text-xs text-text-tertiary">{timeAgo(post.created_at)}</p>
                  </div>
                </Link>
              )}
            </div>
            <span className="text-xs text-text-tertiary">{post.views_count} views</span>
          </div>

          {/* Content */}
          {post.content && (
            <div
              className="prose prose-sm max-w-none text-text-primary mb-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Embedded URL */}
          {embedHtml ? (
            <div className="mb-6" dangerouslySetInnerHTML={{ __html: embedHtml }} />
          ) : post.embedded_url ? (
            <a
              href={post.embedded_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-6 text-sm text-primary hover:underline break-all"
            >
              {post.embedded_url}
            </a>
          ) : null}

          {/* Media Gallery */}
          {media.length > 0 && (
            <div className={`grid gap-2 mb-6 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {media.map((m) => {
                const isVideo = /\.(mp4|webm|ogg)$/i.test(m.file_url)
                return isVideo ? (
                  <video key={m.id} src={m.file_url} controls className="w-full rounded-md" />
                ) : (
                  <div key={m.id} className="relative aspect-video rounded-md overflow-hidden">
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
        <div className="card p-3 mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            {prevPost ? (
              <Link href={`/post/${prevPost.id}`} className="flex items-center gap-1 text-text-secondary hover:text-primary transition-colors">
                <span className="text-text-tertiary">←</span>
                <span className="line-clamp-1">{prevPost.title}</span>
              </Link>
            ) : <span className="text-text-tertiary text-xs">No previous post</span>}
          </div>
          <div className="text-right">
            {nextPost ? (
              <Link href={`/post/${nextPost.id}`} className="flex items-center justify-end gap-1 text-text-secondary hover:text-primary transition-colors">
                <span className="line-clamp-1">{nextPost.title}</span>
                <span className="text-text-tertiary">→</span>
              </Link>
            ) : <span className="text-text-tertiary text-xs">No next post</span>}
          </div>
        </div>

        {/* Comments */}
        <div className="card p-6">
          <CommentList postId={id} currentUser={user} />
        </div>
      </div>
    </div>
  )
}
