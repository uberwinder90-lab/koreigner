'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function EmptyState() {
  const { t, lang } = useLang()

  return (
    <div className="card py-12 sm:py-16 text-center">
      <div className="text-4xl mb-3 sm:mb-4">✍️</div>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
        {lang === 'ko' ? t.noPostsTitle : t.noPostsTitle}
      </p>
      <p className="text-sm mb-4 sm:mb-5" style={{ color: 'var(--text-4)' }}>
        {lang === 'ko' ? t.noPostsDesc : t.noPostsDesc}
      </p>
      <Link href="/submit" className="btn-primary">
        {lang === 'ko' ? t.writeFirst : t.writeFirst}
      </Link>
    </div>
  )
}

