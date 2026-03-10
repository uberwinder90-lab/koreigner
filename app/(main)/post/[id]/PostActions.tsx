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

export default function PostActions({
  postId,
  authorId,
  currentUserId,
  initialLikesCount,
  initialUserLiked,
}: Props) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialUserLiked)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMsg, setReportMsg] = useState('')

  const isAuthor = currentUserId && currentUserId === authorId

  async function handleLike() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
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
    if (!confirm('Are you sure you want to delete this post?')) return
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
      setReportMsg('Report submitted. Thank you.')
      setShowReport(false)
      setReportReason('')
    } else {
      setReportMsg(data.error ?? 'Failed to submit report.')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${liked
              ? 'bg-red-50 text-danger border border-red-200 hover:bg-red-100'
              : 'bg-gray-50 text-text-secondary border border-border hover:bg-gray-100'
            }`}
        >
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={liked ? 0 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {likesCount}
        </button>

        {/* Edit / Delete (author only) */}
        {isAuthor && (
          <>
            <Link
              href={`/submit?edit=${postId}`}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Edit
            </Link>
            <button onClick={handleDelete} className="btn-danger text-xs px-3 py-1.5">
              Delete
            </button>
          </>
        )}

        {/* Report (non-author logged-in users) */}
        {currentUserId && !isAuthor && (
          <button
            onClick={() => setShowReport(true)}
            className="ml-auto text-xs text-text-tertiary hover:text-danger transition-colors"
          >
            Report
          </button>
        )}
      </div>

      {/* Report message */}
      {reportMsg && (
        <p className={`mt-2 text-xs ${reportMsg.includes('Thank') ? 'text-green-600' : 'text-danger'}`}>
          {reportMsg}
        </p>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-text-primary mb-4">Report Post</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field resize-none mb-4"
              rows={4}
              placeholder="Please describe the reason for reporting…"
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowReport(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportLoading || !reportReason.trim()}
                className="btn-danger"
              >
                {reportLoading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
