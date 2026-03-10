import Link from 'next/link'
import Image from 'next/image'
import { timeAgo } from '@/lib/utils'

interface PostCardProps {
  post: {
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
  isNew?: boolean
  isBest?: boolean
}

export default function PostCard({ post, isNew, isBest }: PostCardProps) {
  const likesCount = post.post_likes?.[0]?.count ?? 0
  const commentsCount = post.comments?.[0]?.count ?? 0
  const excerpt = post.content
    ? post.content.replace(/<[^>]+>/g, '').slice(0, 100)
    : ''

  return (
    <article className="card p-4 hover:border-primary/30 hover:shadow-md transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category + Badges */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {post.categories && (
              <Link
                href={`/?category=${post.categories.slug}`}
                className="text-xs text-primary bg-primary-light px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
              >
                {post.categories.name}
              </Link>
            )}
            {isNew && <span className="badge-new">NEW</span>}
            {isBest && <span className="badge-best">BEST</span>}
          </div>

          {/* Title */}
          <h2 className="text-sm font-semibold text-text-primary mb-1 line-clamp-1">
            <Link href={`/post/${post.id}`} className="hover:text-primary transition-colors">
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-xs text-text-tertiary line-clamp-1 mb-2">{excerpt}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            {post.profiles && (
              <Link
                href={`/profile/${post.profiles.username}`}
                className="flex items-center gap-1.5 hover:text-text-secondary transition-colors"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-primary-light flex-shrink-0 relative">
                  {post.profiles.profile_image_url ? (
                    <Image
                      src={post.profiles.profile_image_url}
                      alt={post.profiles.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-primary flex items-center justify-center w-full h-full">
                      {post.profiles.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span>{post.profiles.display_name}</span>
              </Link>
            )}
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs text-text-tertiary">
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views_count}
          </span>
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {likesCount}
          </span>
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentsCount}
          </span>
        </div>
      </div>
    </article>
  )
}
