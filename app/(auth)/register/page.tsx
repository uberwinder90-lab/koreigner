'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'code' | 'details'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to send code.')
      return
    }
    setSuccess('Verification code sent! Check your email.')
    setStep('code')
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setError('')
    setStep('details')
  }

  async function register(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, displayName, code }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Registration failed.')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">Koreigner</Link>
            <h1 className="mt-3 text-xl font-semibold text-text-primary">Create Account</h1>
            <p className="text-sm text-text-tertiary mt-1">Join the community</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['email', 'code', 'details'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${step === s ? 'bg-primary text-white' : i < (['email', 'code', 'details'] as Step[]).indexOf(step) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>

          {error && <div className="alert-error mb-4">{error}</div>}
          {success && step === 'code' && <div className="alert-success mb-4">{success}</div>}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email Address</label>
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
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Sending…' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="label" htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-widest font-bold"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">
                Verify Code
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setSuccess(''); setCode('') }}
                className="btn-secondary w-full py-2.5"
              >
                Change Email
              </button>
            </form>
          )}

          {/* Step 3: Account Details */}
          {step === 'details' && (
            <form onSubmit={register} className="space-y-4">
              <div>
                <label className="label" htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="input-field"
                  placeholder="your_username"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-text-tertiary mt-1">
                  3-20 chars: letters, numbers, underscores only
                </p>
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-tertiary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
