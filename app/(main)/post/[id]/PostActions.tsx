'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  postId: string; authorId: string; currentUserId: string | null
  initialLikesCount: number; initialUserLiked: boolean; viewsCount: number
}

export default function PostActions({ postId, authorId, currentUserId, initialLikesCount, initialUserLiked, viewsCount }: Props) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialUserLiked)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMsg, setReportMsg] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

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
    await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    router.push('/')
  }

  async function handleReport() {
    if (!reportReason.trim()) return
    setReportLoading(true)
    const res = await fetch(`/api/posts/${postId}/report`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    })
    setReportLoading(false)
    const data = await res.json()
    setReportMsg(res.ok ? 'Report submitted. Thank you.' : (data.error ?? 'Failed.'))
    setShowReport(false)
    setReportReason('')
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Reddit-style action bar */}
      <div className="flex items-center flex-wrap gap-1 -mx-1">
        {/* Upvote */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            liked ? '' : 'hover:bg-[var(--bg-alt)]'
          }`}
          style={{
            background: liked ? '#fef2f2' : 'transparent',
            color: liked ? '#ef4444' : 'var(--text-3)',
          }}
        >
          <svg className={`w-4 h-4 transition-transform ${liked ? 'scale-110' : ''}`}
            fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={liked ? 0 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likesCount}</span>
        </button>

        {/* Views */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ color: 'var(--text-4)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{viewsCount} views</span>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-[var(--bg-alt)]"
          style={{ color: copied ? 'var(--success)' : 'var(--text-3)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>

        {/* Author actions */}
        {isAuthor && (
          <>
            <Link href={`/submit?edit=${postId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-[var(--bg-alt)]"
              style={{ color: 'var(--text-3)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-red-50"
              style={{ color: 'var(--danger)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        )}

        {/* Report */}
        {currentUserId && !isAuthor && (
          <button onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-[var(--bg-alt)]"
            style={{ color: 'var(--text-4)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Report
          </button>
        )}
      </div>

      {reportMsg && (
        <p className="mt-2 text-xs px-1" style={{ color: reportMsg.includes('Thank') ? 'var(--success)' : 'var(--danger)' }}>
          {reportMsg}
        </p>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fef2f2' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-center mb-1" style={{ color: 'var(--text-1)' }}>Delete this post?</h3>
            <p className="text-sm text-center mb-5" style={{ color: 'var(--text-3)' }}>This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowReport(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-1)' }}>Report Post</h3>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
              className="input-field resize-none mb-4" rows={4}
              placeholder="Describe the issue…" maxLength={500} />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReport} disabled={reportLoading || !reportReason.trim()} className="btn-danger flex-1">
                {reportLoading ? 'Submitting…' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
