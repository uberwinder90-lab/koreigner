'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, Heart, MessageCircle, Clock3 } from 'lucide-react'
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
  const { lang, t } = useLang()
  const likesCount = post.post_likes?.[0]?.count ?? 0
  const commentsCount = post.comments?.[0]?.count ?? 0
  const excerpt = post.content
    ? post.content.replace(/<[^>]+>/g, '').trim().slice(0, 120)
    : ''

  return (
    <article className="card card-hover group p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {post.categories && (
              <Link
                href={`/?category=${post.categories.slug}`}
                className="badge-category min-h-8 hover:opacity-80 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                {post.categories.name}
              </Link>
            )}
            {isNew && <span className="badge-new">NEW</span>}
            {isBest && <span className="badge-best">🔥 HOT</span>}
          </div>

          <h2 className="mb-2 text-base font-bold leading-relaxed sm:text-lg" style={{ color: 'var(--text-1)' }}>
            <Link
              href={`/post/${post.id}`}
              className="line-clamp-2 transition-colors group-hover:text-[var(--primary)] hover:underline"
              style={{ color: 'inherit' }}
            >
              {post.title}
            </Link>
          </h2>

          {excerpt && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-3)' }}>
              {excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-4)' }}>
            <Link
              href={post.profiles ? `/profile/${post.profiles.username}` : '#'}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 transition-colors hover:text-[var(--primary)]"
              onClick={(e) => !post.profiles && e.preventDefault()}
            >
              <span className="relative h-7 w-7 overflow-hidden rounded-full" style={{ background: 'var(--primary-light)' }}>
                {post.profiles?.profile_image_url ? (
                  <Image src={post.profiles.profile_image_url} alt={post.profiles.display_name} fill className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
                    {(post.profiles?.display_name?.[0] ?? 'U').toUpperCase()}
                  </span>
                )}
              </span>
              <span className="font-medium" style={{ color: 'var(--text-2)' }}>
                {post.profiles?.display_name ?? 'Unknown'}
              </span>
            </Link>

            <span className="inline-flex min-h-10 items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {timeAgo(post.created_at, lang)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-3 text-xs sm:text-sm" style={{ color: 'var(--text-4)' }}>
            <span className="inline-flex min-h-10 items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.views_count} {t.views}
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              {commentsCount} {t.comments}
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {likesCount} {t.likes}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
