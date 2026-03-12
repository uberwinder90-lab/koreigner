'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { useLang } from '@/lib/i18n'

interface PopularPost { id: string; title: string; views_count: number }

export default function SidebarClient({
  bestPosts,
}: {
  categories?: { id: number; name: string; slug: string }[]
  bestPosts: PopularPost[]
}) {
  const { t, lang } = useLang()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/?q=${encodeURIComponent(q)}`)
  }

  return (
    <aside className="space-y-4">

      {/* ── Hero + Search (unified card) ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1d4ed8 0%, #6d28d9 100%)' }}
      >
        {/* Title area */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Background glow orbs */}
          <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

          <p className="relative mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Koreigner
          </p>
          <h2 className="relative text-lg font-extrabold leading-snug text-white">
            Korea&apos;s #1 Community<br />for Foreigners
          </h2>
        </div>

        {/* Search area — white/frosted bottom panel */}
        <div className="px-5 pb-5">
          <form onSubmit={onSearch}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 transition-all duration-200"
              style={{
                background: focused ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)',
                border: focused ? '1.5px solid rgba(255,255,255,0.55)' : '1.5px solid rgba(255,255,255,0.22)',
              }}
            >
              <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={lang === 'ko' ? '검색어를 입력하세요' : 'Search posts…'}
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: '#fff' }}
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="flex-shrink-0 rounded-lg p-1.5 transition-all duration-150 disabled:opacity-30 hover:bg-white/20"
                aria-label="Search"
              >
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Trending posts ── */}
      {bestPosts.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>
            {t.trending}
          </h3>
          <ul className="space-y-2">
            {bestPosts.map((post, i) => (
              <li key={post.id}>
                <Link href={`/post/${post.id}`} className="flex gap-2.5 group">
                  <span
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-bold"
                    style={{
                      background: i === 0 ? '#fef3c7' : 'var(--bg-alt)',
                      color: i === 0 ? '#92400e' : 'var(--text-4)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed transition-colors group-hover:text-[var(--primary)]"
                      style={{ color: 'var(--text-2)' }}>
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-4)' }}>
                      {post.views_count} {t.views}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Community stats ── */}
      <div className="card p-4">
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>
          {t.communityInfo}
        </h3>
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-3)' }}>
          <p>{t.communityLine1}</p>
          <p>{t.communityLine2}</p>
          <p>{t.communityLine3}</p>
        </div>
      </div>
    </aside>
  )
}
