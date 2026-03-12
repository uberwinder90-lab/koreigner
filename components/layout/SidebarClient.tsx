'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { useLang } from '@/lib/i18n'

interface PopularPost { id: string; title: string; views_count: number }
interface SiteBanner { id: string; title: string; subtitle: string | null; link_url: string | null; bg_color: string; text_color: string; is_popup: boolean }

export default function SidebarClient({
  bestPosts,
  banners = [],
}: {
  categories?: { id: number; name: string; slug: string }[]
  bestPosts: PopularPost[]
  banners?: SiteBanner[]
}) {
  const { t, lang } = useLang()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [popupBanner, setPopupBanner] = useState<SiteBanner | null>(null)

  // 한 번만 뜨는 배너 팝업 (배너별로 로컬스토리지에 기록)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const candidate = banners.find(b => b.is_popup)
    if (!candidate) return
    const key = `koreigner_banner_seen_${candidate.id}`
    if (!window.localStorage.getItem(key)) {
      setPopupBanner(candidate)
    }
  }, [banners])

  function closePopup(remember: boolean) {
    if (popupBanner && typeof window !== 'undefined' && remember) {
      window.localStorage.setItem(`koreigner_banner_seen_${popupBanner.id}`, '1')
    }
    setPopupBanner(null)
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/?q=${encodeURIComponent(q)}`)
  }

  return (
    <aside className="space-y-4">

      {/* ── Banner Popup Modal ── */}
      {popupBanner && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div
            className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative"
            style={{ background: popupBanner.bg_color, color: popupBanner.text_color }}
          >
            <button
              type="button"
              onClick={() => closePopup(true)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.22)', color: '#fff' }}
            >
              ✕
            </button>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase opacity-80 mb-1">
                Koreigner
              </p>
              <h2 className="text-lg font-bold leading-snug">
                {popupBanner.title}
              </h2>
              {popupBanner.subtitle && (
                <p className="mt-2 text-sm opacity-90">
                  {popupBanner.subtitle}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                {popupBanner.link_url && (
                  <a
                    href={popupBanner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.92)', color: '#111827' }}
                    onClick={() => closePopup(true)}
                  >
                    {lang === 'ko' ? '자세히 보기' : 'Learn more'}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => closePopup(true)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-full text-xs font-semibold"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.6)', color: popupBanner.text_color }}
                >
                  {lang === 'ko' ? '오늘 하루 보지 않기' : 'Hide for today'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Active banners ── */}
      {banners.map(bn => (
        <div key={bn.id} className="rounded-2xl overflow-hidden">
          {bn.link_url ? (
            <a href={bn.link_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-4 hover:opacity-90 transition-opacity"
              style={{ background: bn.bg_color, color: bn.text_color }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{bn.title}</p>
                {bn.subtitle && <p className="text-xs opacity-80 mt-0.5">{bn.subtitle}</p>}
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-70" />
            </a>
          ) : (
            <div className="flex items-center gap-3 px-5 py-4"
              style={{ background: bn.bg_color, color: bn.text_color }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{bn.title}</p>
                {bn.subtitle && <p className="text-xs opacity-80 mt-0.5">{bn.subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      ))}

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
