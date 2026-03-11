'use client'

import Link from 'next/link'
import Image from 'next/image'
import { timeAgo } from '@/lib/utils'
import { useLang } from '@/lib/i18n'

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
  const { lang } = useLang()
  const likesCount = post.post_likes?.[0]?.count ?? 0
  const commentsCount = post.comments?.[0]?.count ?? 0
  const excerpt = post.content
    ? post.content.replace(/<[^>]+>/g, '').trim().slice(0, 120)
    : ''

  return (
    <article
      className="card card-hover group"
      style={{ padding: '16px 20px' }}
    >
      <div className="flex gap-4 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges + Category row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {post.categories && (
              <Link
                href={`/?category=${post.categories.slug}`}
                className="badge-category hover:opacity-80 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                {post.categories.name}
              </Link>
            )}
            {isNew && <span className="badge-new">NEW</span>}
            {isBest && <span className="badge-best">🔥 HOT</span>}
          </div>

          {/* Title */}
          <h2 className="text-sm font-semibold mb-1.5 leading-snug line-clamp-2" style={{ color: 'var(--text-1)' }}>
            <Link
              href={`/post/${post.id}`}
              className="hover:underline transition-colors group-hover:text-[var(--primary)]"
              style={{ color: 'inherit' }}
            >
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-xs line-clamp-1 mb-2.5 leading-relaxed" style={{ color: 'var(--text-4)' }}>
              {excerpt}
            </p>
          )}

          {/* Author + time */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-4)' }}>
            {post.profiles && (
              <Link
                href={`/profile/${post.profiles.username}`}
                className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 relative"
                  style={{ background: 'var(--primary-light)' }}>
                  {post.profiles.profile_image_url ? (
                    <Image src={post.profiles.profile_image_url} alt={post.profiles.display_name} fill className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: 'var(--primary)' }}>
                      {post.profiles.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-medium">{post.profiles.display_name}</span>
              </Link>
            )}
            <span>·</span>
            <span>{timeAgo(post.created_at, lang)}</span>
          </div>
        </div>

        {/* Stats column */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-4)' }}>
            {/* Views */}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.views_count}
            </span>
            {/* Likes */}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {likesCount}
            </span>
            {/* Comments */}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              {commentsCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
