'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Comment {
  id: string; content: string; created_at: string; parent_id: string | null; author_id: string
  profiles: { id: string; username: string; display_name: string; profile_image_url: string | null } | null
}
interface Props { postId: string; currentUser: User | null }

export default function CommentList({ postId, currentUser }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchComments() {
    const res = await fetch(`/api/comments?postId=${postId}`)
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchComments() }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true); setError('')
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentId: replyTo?.id ?? null }),
    })
    setSubmitting(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to post comment.'); return }
    setContent(''); setReplyTo(null); fetchComments()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    fetchComments()
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  function Avatar({ profile }: { profile: Comment['profiles'] }) {
    if (!profile) return (
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: 'var(--bg-alt)', color: 'var(--text-3)' }}>?</div>
    )
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative"
        style={{ background: 'var(--primary-light)' }}>
        {profile.profile_image_url ? (
          <Image src={profile.profile_image_url} alt={profile.display_name} fill className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: 'var(--primary)' }}>{profile.display_name[0]?.toUpperCase()}</span>
        )}
      </div>
    )
  }

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    return (
      <div className={isReply ? 'ml-11 mt-2' : ''}>
        <div className="flex gap-3 py-3">
          <Avatar profile={comment.profiles} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              {comment.profiles ? (
                <Link href={`/profile/${comment.profiles.username}`}
                  className="text-xs font-semibold hover:text-[var(--primary)] transition-colors"
                  style={{ color: 'var(--text-1)' }}>
                  {comment.profiles.display_name}
                </Link>
              ) : <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>[deleted]</span>}
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>{timeAgo(comment.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-2)' }}>
              {comment.content}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {currentUser && !isReply && (
                <button
                  onClick={() => setReplyTo(prev =>
                    prev?.id === comment.id ? null : { id: comment.id, name: comment.profiles?.display_name ?? '' }
                  )}
                  className="text-xs font-medium transition-colors"
                  style={{ color: replyTo?.id === comment.id ? 'var(--primary)' : 'var(--text-4)' }}
                >
                  {replyTo?.id === comment.id ? '↩ Cancel' : '↩ Reply'}
                </button>
              )}
              {currentUser?.id === comment.author_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs transition-colors hover:text-[var(--danger)]"
                  style={{ color: 'var(--text-4)' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Reply input inline */}
        {replyTo?.id === comment.id && currentUser && (
          <div className="ml-11 mb-2">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="input-field text-sm py-2 flex-1"
                placeholder={`Reply to ${replyTo.name}…`}
                autoFocus
                maxLength={1000}
              />
              <button type="submit" disabled={submitting || !content.trim()} className="btn-primary py-2 px-3 text-xs">
                Send
              </button>
            </form>
          </div>
        )}
        {replies(comment.id).map(r => <CommentItem key={r.id} comment={r} isReply />)}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
        <svg className="w-4 h-4" style={{ color: 'var(--text-4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        Comments <span className="text-sm font-normal" style={{ color: 'var(--text-4)' }}>({comments.length})</span>
      </h2>

      {/* Main comment form */}
      {currentUser ? (
        !replyTo && (
          <div className="mb-5">
            {error && (
              <div className="alert-error mb-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="input-field resize-none mb-2"
                rows={3}
                placeholder="Write a comment…"
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>{content.length}/1000</span>
                <button type="submit" disabled={submitting || !content.trim()} className="btn-primary text-sm px-4 py-2">
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="rounded-xl p-5 text-center mb-5" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-3)' }}>Join the conversation</p>
          <div className="flex justify-center gap-2">
            <Link href="/login" className="btn-primary text-sm px-4 py-2">Log In</Link>
            <Link href="/register" className="btn-secondary text-sm px-4 py-2">Sign Up</Link>
          </div>
        </div>
      )}

      {/* Comments */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : topLevel.length > 0 ? (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {topLevel.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>No comments yet. Be the first!</p>
        </div>
      )}
    </div>
  )
}
