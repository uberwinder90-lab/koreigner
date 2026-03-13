'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  display_name: string
  profile_image_url: string | null
  created_at: string
}

interface Props {
  user: User
  profile: Profile
}

export default function MypageClient({ user, profile }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(profile.display_name)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.profile_image_url)
  const [profileFile, setProfileFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 5MB.' })
      return
    }
    setProfileFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleProfileSave() {
    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    let imageUrl = profile.profile_image_url

    if (profileFile) {
      const form = new FormData()
      form.append('file', profileFile)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        setMessage({ type: 'error', text: data?.error || 'Failed to upload image.' })
        setLoading(false)
        return
      }
      imageUrl = data.url as string
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, profile_image_url: imageUrl } as never)
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
      router.refresh()
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })
    if (signInError) {
      setMessage({ type: 'error', text: 'Current password is incorrect.' })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update password.' })
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    const supabase = createClient()
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      setMessage({ type: 'error', text: 'Failed to delete account.' })
    }
  }

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">My Page</h1>

      {message && (
        <div className={`mb-6 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <section className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
          Profile
        </h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-primary-light border-2 border-border cursor-pointer relative"
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="Profile" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                  {profile.display_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <p className="text-xs text-text-tertiary mt-1 text-center">Max 5MB</p>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="label">Email</label>
              <p className="text-sm text-text-secondary bg-gray-50 px-3 py-2 rounded-md border border-border">
                {user.email}
              </p>
            </div>
            <div>
              <label className="label" htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                maxLength={50}
              />
            </div>
            <div>
              <label className="label">Username</label>
              <p className="text-sm text-text-secondary bg-gray-50 px-3 py-2 rounded-md border border-border">
                @{profile.username}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleProfileSave} disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Password Section */}
      <section className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
          Change Password
        </h2>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="label" htmlFor="currentPw">Current Password</label>
            <input
              id="currentPw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="newPw">New Password</label>
            <input
              id="newPw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPw">Confirm New Password</label>
            <input
              id="confirmPw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          <button onClick={handlePasswordChange} disabled={loading} className="btn-primary">
            {loading ? 'Updating…' : 'Change Password'}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card p-6 border-danger/30">
        <h2 className="text-base font-semibold text-danger mb-4 pb-2 border-b border-red-100">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Delete Account</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              Permanently delete your account and all your posts.
            </p>
          </div>
          <button onClick={handleDeleteAccount} className="btn-danger">
            Delete Account
          </button>
        </div>
      </section>
    </div>
  )
}
