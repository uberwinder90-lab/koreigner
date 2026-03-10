'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      {error && <div className="alert-error">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">Koreigner</Link>
            <h1 className="mt-3 text-xl font-semibold text-text-primary">Welcome back</h1>
            <p className="text-sm text-text-tertiary mt-1">Sign in to your account</p>
          </div>

          <Suspense fallback={<div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
          </div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-text-tertiary">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
