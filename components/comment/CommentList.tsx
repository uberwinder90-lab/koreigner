'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  author_id: string
  profiles: {
    id: string
    username: string
    display_name: string
    profile_image_url: string | null
  } | null
}

interface Props {
  postId: string
  currentUser: User | null
}

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
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentId: replyTo?.id ?? null }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to post comment.')
      return
    }
    setContent('')
    setReplyTo(null)
    fetchComments()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    fetchComments()
  }

  const topLevel = comments.filter((c) => !c.parent_id)
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId)

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
        <div className="flex items-start gap-3 py-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-light flex-shrink-0 relative">
            {comment.profiles?.profile_image_url ? (
              <Image
                src={comment.profiles.profile_image_url}
                alt={comment.profiles.display_name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary flex items-center justify-center w-full h-full">
                {comment.profiles?.display_name[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {comment.profiles && (
                <Link
                  href={`/profile/${comment.profiles.username}`}
                  className="text-xs font-semibold text-text-primary hover:text-primary transition-colors"
                >
                  {comment.profiles.display_name}
                </Link>
              )}
              <span className="text-xs text-text-tertiary">{timeAgo(comment.created_at)}</span>
            </div>
            <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1">
              {currentUser && !isReply && (
                <button
                  onClick={() => setReplyTo({ id: comment.id, name: comment.profiles?.display_name ?? '' })}
                  className="text-xs text-text-tertiary hover:text-primary transition-colors"
                >
                  Reply
                </button>
              )}
              {currentUser?.id === comment.author_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-text-tertiary hover:text-danger transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Replies */}
        {replies(comment.id).map((r) => (
          <CommentItem key={r.id} comment={r} isReply />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-primary bg-primary-light px-3 py-1.5 rounded">
              <span>Replying to <strong>{replyTo.name}</strong></span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-text-tertiary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          )}
          {error && <div className="alert-error mb-2">{error}</div>}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a comment…'}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-text-tertiary">{content.length}/1000</span>
            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary text-xs px-3 py-1.5">
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-4 text-center text-sm text-text-tertiary mb-6">
          <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>{' '}
          to write a comment.
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : topLevel.length > 0 ? (
        <div className="divide-y divide-border">
          {topLevel.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-6">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  )
}
