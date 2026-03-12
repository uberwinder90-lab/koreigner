'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function HomeHeader({
  tab,
  category,
  q = '',
}: {
  tab: string
  category?: string
  q?: string
}) {
  const { t } = useLang()

  return (
    <div className="no-scrollbar mb-5 flex w-full gap-1 overflow-x-auto rounded-xl p-1" style={{ background: 'var(--bg-alt)' }}>
      {(['new', 'best'] as const).map(tp => (
        <Link
          key={tp}
          href={`?tab=${tp}${category ? `&category=${category}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
          className="inline-flex min-h-11 flex-shrink-0 items-center rounded-lg px-5 text-sm font-semibold transition-all duration-150"
          style={{
            background: tab === tp ? 'var(--primary)' : 'transparent',
            color: tab === tp ? 'white' : 'var(--text-3)',
          }}
        >
          {tp === 'new' ? t.tabNew : t.tabHot}
        </Link>
      ))}
    </div>
  )
}
