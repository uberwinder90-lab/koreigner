'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

const CAT_ICONS: Record<string, string> = {
  free: '💬', jobs: '💼', realestate: '🏠', marketplace: '🛒', info: '📌',
}

export default function HomeHeader({
  tab,
  category,
}: {
  tab: string
  category?: string
}) {
  const { t, lang } = useLang()

  const catLabel = category
    ? (lang === 'ko'
        ? ({ free: '자유게시판', jobs: '구인구직', realestate: '부동산', marketplace: '중고거래', info: '정보' } as Record<string, string>)[category] ?? category
        : ({ free: 'Free Board', jobs: 'Jobs', realestate: 'Real Estate', marketplace: 'Marketplace', info: 'Info' } as Record<string, string>)[category] ?? category)
    : null

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            {category && <span>{CAT_ICONS[category] ?? '📌'}</span>}
            {catLabel ?? t.community}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            {t.subtitle}
          </p>
        </div>
        <Link
          href="/submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm hover:shadow-md active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t.write}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'var(--bg-alt)' }}>
        {(['new', 'best'] as const).map(tp => (
          <Link
            key={tp}
            href={`?tab=${tp}${category ? `&category=${category}` : ''}`}
            className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: tab === tp ? 'var(--primary)' : 'transparent',
              color: tab === tp ? 'white' : 'var(--text-3)',
            }}
          >
            {tp === 'new' ? t.tabNew : t.tabHot}
          </Link>
        ))}
      </div>
    </>
  )
}
