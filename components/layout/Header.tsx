'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="page-container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-primary tracking-tight">
          Koreigner
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-md transition-colors"
          >
            Home
          </Link>
          <Link
            href="/submit"
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-md transition-colors"
          >
            Write
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="w-7 h-7 bg-primary-light text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:inline max-w-24 truncate">{user.email}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-surface border border-border rounded-lg shadow-md py-1 z-50">
                  <Link
                    href="/mypage"
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Page
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-xs px-3 py-1.5">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-xs px-3 py-1.5">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
