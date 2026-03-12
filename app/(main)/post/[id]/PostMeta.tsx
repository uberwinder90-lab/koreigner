'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { timeAgo } from '@/lib/utils'

interface Props {
  createdAt: string
  authorUsername: string | null
  categorySlug: string | null
  categoryName: string | null
}

export default function PostMeta({ createdAt, authorUsername, categorySlug, categoryName }: Props) {
  const router = useRouter()
  const { lang, t } = useLang()

  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex min-h-10 items-center gap-1.5 mb-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-[var(--bg-alt)]"
        style={{ color: 'var(--text-3)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{lang === 'ko' ? '목록으로' : 'Back'}</span>
      </button>

      {/* Post header bar */}
      <div
        className="flex flex-wrap items-center gap-1.5 text-xs"
        style={{ color: 'var(--text-4)' }}
      >
        {categorySlug && categoryName && (
          <Link
            href={`/?category=${categorySlug}`}
            className="flex items-center gap-1 font-bold hover:underline"
            style={{ color: 'var(--text-1)' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
              style={{ background: 'var(--primary)' }}
            >
              k
            </div>
            {(t as Record<string, string>)[categorySlug] ?? categoryName}
          </Link>
        )}
        <span>•</span>
        <span>{t.postedBy}</span>
        {authorUsername && (
          <Link
            href={`/profile/${authorUsername}`}
            className="font-medium hover:underline"
            style={{ color: 'var(--text-3)' }}
          >
            @{authorUsername}
          </Link>
        )}
        <span>•</span>
        <span>{timeAgo(createdAt, lang)}</span>
      </div>
    </>
  )
}
