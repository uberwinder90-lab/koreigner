'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang, CATEGORIES } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-3)',
        background: 'var(--bg-alt)',
      }}
      title="Switch language"
    >
      {lang === 'ko' ? '🇰🇷 KO' : '🇺🇸 EN'}
    </button>
  )
}

function CategoryBarInner() {
  const { t, lang } = useLang()
  const searchParams = useSearchParams()
  const currentCat = searchParams.get('category') ?? ''
  const pathname = usePathname()
  const isHome = pathname === '/'

  const cats = [
    { slug: '', icon: '🌏', label: t.allPosts },
    { slug: 'free',        icon: '💬', label: lang === 'ko' ? '자유게시판' : 'Free Board' },
    { slug: 'jobs',        icon: '💼', label: lang === 'ko' ? '구인구직'   : 'Jobs' },
    { slug: 'realestate',  icon: '🏠', label: lang === 'ko' ? '부동산'     : 'Real Estate' },
    { slug: 'marketplace', icon: '🛒', label: lang === 'ko' ? '중고거래'   : 'Marketplace' },
    { slug: 'info',        icon: '📌', label: lang === 'ko' ? '정보'       : 'Info' },
  ]

  return (
    <div
      className="w-full border-t"
      style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.97)' }}
    >
      <div className="page-container flex items-center h-10 gap-1 overflow-x-auto no-scrollbar">
        {cats.map(cat => {
          const active = isHome && currentCat === cat.slug
          return (
            <Link
              key={cat.slug}
              href={cat.slug ? `/?category=${cat.slug}` : '/'}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'white' : 'var(--text-3)',
                fontWeight: active ? '700' : '500',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null)).catch(() => {})
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null)
      })
      return () => listener.subscription.unsubscribe()
    } catch { /* env vars not set */ }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleLogout() {
    setMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Main bar ── */}
      <div className="page-container flex items-center justify-between h-[56px] gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
          >
            K
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block" style={{ color: 'var(--text-1)' }}>
            Koreigner
          </span>
        </Link>

        {/* Right: lang toggle + auth + write button */}
        <div className="flex items-center gap-2 ml-auto">
          <LangToggle />

          {user ? (
            <>
              {/* Avatar dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-alt)] transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
                  >
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate" style={{ color: 'var(--text-2)' }}>
                    {user.email?.split('@')[0]}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 hidden sm:block transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-4)' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 py-1.5 rounded-xl z-50 animate-fade-in"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    <div className="px-4 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-3)' }}>{user.email}</p>
                    </div>
                    <Link
                      href="/mypage"
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-[var(--bg-alt)] transition-colors"
                      style={{ color: 'var(--text-2)' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t.mypage}
                    </Link>
                    <div className="h-px mx-4 my-1" style={{ background: 'var(--border)' }} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>

              {/* Write CTA */}
              <Link
                href="/submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">{t.write}</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:inline-flex btn-secondary py-2 px-4 text-sm">{t.login}</Link>
              <Link href="/register" className="btn-primary py-2 px-4 text-sm">{t.signup}</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-[var(--bg-alt)] transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menu"
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`block h-0.5 rounded-full transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} style={{ background: 'var(--text-2)' }} />
              <span className={`block h-0.5 rounded-full transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} style={{ background: 'var(--text-2)' }} />
              <span className={`block h-0.5 rounded-full transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} style={{ background: 'var(--text-2)' }} />
            </div>
          </button>
        </div>
      </div>

      {/* ── Category bar ── */}
      <Suspense fallback={null}>
        <CategoryBarInner />
      </Suspense>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="sm:hidden border-t animate-slide-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="page-container py-3 space-y-1">
            {user ? (
              <>
                <Link href="/mypage" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--text-2)] hover:bg-[var(--bg-alt)]">
                  {t.mypage}
                </Link>
                <Link href="/submit" className="block px-4 py-2.5 rounded-lg text-sm font-bold text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
                  ✏️ {t.write}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50"
                  style={{ color: 'var(--danger)' }}
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 pb-1">
                <Link href="/login" className="btn-secondary flex-1 justify-center py-2 text-sm">{t.login}</Link>
                <Link href="/register" className="btn-primary flex-1 justify-center py-2 text-sm">{t.signup}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
