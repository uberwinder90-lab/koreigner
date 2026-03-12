'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ChevronDown,
  Globe,
  House,
  Info,
  LogOut,
  Menu,
  MessageCircle,
  BriefcaseBusiness,
  Building2,
  ShoppingBag,
  UserCircle2,
  X,
  PencilLine,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold"
      style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: '#fff' }}
      aria-label="Change language"
    >
      <Globe className="h-4 w-4" />
      <span>{lang === 'ko' ? 'KR' : 'EN'}</span>
    </button>
  )
}

function CategoryBarInner() {
  const { t } = useLang()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentCat = searchParams.get('category') ?? ''
  const isHome = pathname === '/'

  const categories = [
    { slug: '', label: t.allPosts, icon: House },
    { slug: 'free', label: t.free, icon: MessageCircle },
    { slug: 'jobs', label: t.jobs, icon: BriefcaseBusiness },
    { slug: 'realestate', label: t.realestate, icon: Building2 },
    { slug: 'marketplace', label: t.marketplace, icon: ShoppingBag },
    { slug: 'info', label: t.info, icon: Info },
  ]

  return (
    <div className="border-t bg-white" style={{ borderColor: 'var(--border)' }}>
      <div className="page-container no-scrollbar flex h-12 items-center gap-2 overflow-x-auto">
        {categories.map((cat) => {
          const active = isHome && currentCat === cat.slug
          const Icon = cat.icon
          return (
            <Link
              key={cat.slug || 'all'}
              href={cat.slug ? `/?category=${cat.slug}` : '/'}
              className="inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition"
              style={{
                background: active ? 'var(--primary)' : 'var(--bg)',
                color: active ? '#fff' : 'var(--text-2)',
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{cat.label}</span>
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
  const { t, lang } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null)).catch(() => {})
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null)
      })
      return () => listener.subscription.unsubscribe()
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    function closeOnOutsideClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header
      className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="page-container flex h-16 items-center justify-between gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{ background: 'var(--primary)' }}
          >
            K
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Koreigner
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LangToggle />

          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: '#fff' }}
              >
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  {initials}
                </span>
                <span className="hidden sm:block max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border bg-white py-1.5 shadow-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Link href="/mypage" className="flex min-h-11 items-center gap-2 px-3 text-sm hover:bg-slate-50">
                    <UserCircle2 className="h-4 w-4" />
                    <span>{t.mypage}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-2 px-3 text-sm hover:bg-red-50"
                    style={{ color: 'var(--danger)' }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl border px-3 sm:px-4 text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                {t.login}
              </Link>
              <Link href="/register" className="hidden sm:inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                {t.signup}
              </Link>
            </div>
          )}

          <Link
            href={user ? '/submit' : '/login'}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]"
            style={{ background: 'var(--primary)' }}
          >
            <PencilLine className="h-4 w-4" />
            <span className="hidden sm:inline">{t.write}</span>
          </Link>

          {/* Mobile search icon */}
          <button
            type="button"
            onClick={() => { setSearchOpen(v => !v); setMobileOpen(false) }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border sm:hidden"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => { setMobileOpen((v) => !v); setSearchOpen(false) }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border sm:hidden"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Suspense fallback={null}>
        <CategoryBarInner />
      </Suspense>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="border-t bg-white sm:hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="page-container py-3">
            <form
              onSubmit={e => {
                e.preventDefault()
                const q = searchQuery.trim()
                if (q) { router.push(`/?q=${encodeURIComponent(q)}`); setSearchOpen(false); setSearchQuery('') }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ko' ? '검색어 입력…' : 'Search…'}
                  className="h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-1)' }}
                />
              </div>
              <button type="submit" className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
                {t.search}
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t bg-white sm:hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="page-container space-y-1 py-2">
            {user ? (
              <>
                <Link href="/mypage" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-slate-50">
                  {t.mypage}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-red-50"
                  style={{ color: 'var(--danger)' }}
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-1 pb-1">
                <Link href="/login" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-slate-50" style={{ color: 'var(--text-2)' }}>
                  {t.login}
                </Link>
                <Link href="/register" className="flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
                  {t.signup}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
