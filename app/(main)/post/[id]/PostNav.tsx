'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

interface NavPost { id: string; title: string }

export default function PostNav({ prevPost, nextPost }: { prevPost: NavPost | null; nextPost: NavPost | null }) {
  const { t } = useLang()
  if (!prevPost && !nextPost) return null
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div>
        {prevPost ? (
          <Link href={`/post/${prevPost.id}`}
            className="card p-3 flex items-start gap-2 hover:border-[var(--primary)] transition-colors group h-full"
            style={{ color: 'var(--text-3)' }}>
            <span className="mt-0.5 flex-shrink-0">←</span>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>{t.prev}</p>
              <p className="text-xs font-medium line-clamp-2 group-hover:text-[var(--primary)] transition-colors">{prevPost.title}</p>
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
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>{t.next}</p>
              <p className="text-xs font-medium line-clamp-2 group-hover:text-[var(--primary)] transition-colors">{nextPost.title}</p>
            </div>
            <span className="mt-0.5 flex-shrink-0">→</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
