'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  postId: string
  authorId: string
  currentUserId: string | null
  initialLikesCount: number
  initialUserLiked: boolean
}

export default function PostActions({ postId, authorId, currentUserId, initialLikesCount, initialUserLiked }: Props) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialUserLiked)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMsg, setReportMsg] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAuthor = currentUserId && currentUserId === authorId

  async function handleLike() {
    if (!currentUserId) { router.push('/login'); return }
    if (likeLoading) return
    setLikeLoading(true)
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setLiked(data.liked)
      setLikesCount(data.count)
    }
    setLikeLoading(false)
  }

  async function handleDelete() {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
  }

  async function handleReport() {
    if (!reportReason.trim()) return
    setReportLoading(true)
    const res = await fetch(`/api/posts/${postId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    })
    setReportLoading(false)
    const data = await res.json()
    if (res.ok) {
      setReportMsg('Report submitted. Thank you for keeping the community safe.')
      setShowReport(false)
      setReportReason('')
    } else {
      setReportMsg(data.error ?? 'Failed to submit report.')
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 pt-5 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            liked
              ? 'text-red-500'
              : 'hover:bg-[var(--bg-alt)]'
          }`}
          style={{
            background: liked ? '#fef2f2' : 'transparent',
            border: liked ? '1.5px solid #fecaca' : '1.5px solid var(--border)',
            color: liked ? '#ef4444' : 'var(--text-3)',
          }}
        >
          <svg
            className={`w-4 h-4 transition-transform ${liked ? 'scale-110' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={liked ? 0 : 2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{likesCount}</span>
          {!currentUserId && <span className="text-xs font-normal">(Log in to like)</span>}
        </button>

        <div className="flex-1" />

        {/* Author actions */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/submit?edit=${postId}`}
              className="btn-secondary text-xs px-3 py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger text-xs px-3 py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}

        {/* Report */}
        {currentUserId && !isAuthor && (
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-alt)]"
            style={{ color: 'var(--text-4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Report
          </button>
        )}
      </div>

      {reportMsg && (
        <p className={`mt-2 text-xs px-2 ${reportMsg.includes('Thank') ? 'text-green-600' : ''}`}
          style={{ color: reportMsg.includes('Thank') ? undefined : 'var(--danger)' }}>
          {reportMsg}
        </p>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#fef2f2' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-center mb-1" style={{ color: 'var(--text-1)' }}>Delete Post?</h3>
            <p className="text-sm text-center mb-5" style={{ color: 'var(--text-3)' }}>
              This action cannot be undone. The post will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowReport(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>Report Post</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              Please describe why this post should be reviewed.
            </p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="input-field resize-none mb-4"
              rows={4}
              placeholder="e.g. Spam, harassment, misinformation…"
              maxLength={500}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleReport}
                disabled={reportLoading || !reportReason.trim()}
                className="btn-danger flex-1"
              >
                {reportLoading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
