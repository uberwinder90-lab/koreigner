'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { useLang } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

interface Comment {
  id: string; content: string; created_at: string; parent_id: string | null; author_id: string
  profiles: { id: string; username: string; display_name: string; profile_image_url: string | null } | null
}
interface Props { postId: string; currentUser: User | null }

export default function CommentList({ postId, currentUser }: Props) {
  const { lang } = useLang()
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
    const msg = lang === 'ko' ? '이 댓글을 삭제할까요?' : 'Delete this comment?'
    if (!confirm(msg)) return
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    fetchComments()
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  function Avatar({ profile, size = 8 }: { profile: Comment['profiles']; size?: number }) {
    const cls = `w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 relative`
    if (!profile) return (
      <div className={`${cls} flex items-center justify-center text-xs font-bold`}
        style={{ background: 'var(--bg-alt)', color: 'var(--text-3)' }}>?</div>
    )
    return (
      <div className={cls} style={{ background: 'var(--primary-light)' }}>
        {profile.profile_image_url ? (
          <Image
            src={profile.profile_image_url}
            alt={profile.display_name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: 'var(--primary)' }}>{profile.display_name[0]?.toUpperCase()}</span>
        )}
      </div>
    )
  }

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    const replyLabel = lang === 'ko' ? '답글' : 'Reply'
    const cancelLabel = lang === 'ko' ? '취소' : 'Cancel'
    const deleteLabel = lang === 'ko' ? '삭제' : 'Delete'

    return (
      <div className={isReply ? 'ml-8 sm:ml-11 mt-2' : ''}>
        {isReply && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: 'var(--border)' }} />
        )}
        <div className={`flex gap-3 py-3 ${isReply ? 'relative pl-3' : ''}`}>
          <Avatar profile={comment.profiles} size={isReply ? 7 : 8} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
              {comment.profiles ? (
                <Link href={`/profile/${comment.profiles.username}`}
                  className="text-xs font-semibold hover:text-[var(--primary)] transition-colors"
                  style={{ color: 'var(--text-1)' }}>
                  {comment.profiles.display_name}
                </Link>
              ) : <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>[deleted]</span>}
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>{timeAgo(comment.created_at, lang)}</span>
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
                  className="inline-flex min-h-8 items-center text-xs font-medium transition-colors"
                  style={{ color: replyTo?.id === comment.id ? 'var(--primary)' : 'var(--text-4)' }}
                >
                  ↩ {replyTo?.id === comment.id ? cancelLabel : replyLabel}
                </button>
              )}
              {currentUser?.id === comment.author_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="inline-flex min-h-8 items-center text-xs transition-colors hover:text-[var(--danger)]"
                  style={{ color: 'var(--text-4)' }}
                >
                  {deleteLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline reply form */}
        {replyTo?.id === comment.id && currentUser && (
          <div className="ml-8 sm:ml-11 mb-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="input-field text-sm py-2 flex-1"
                placeholder={`${lang === 'ko' ? '답글 작성' : 'Reply to'} ${replyTo.name}…`}
                autoFocus
                maxLength={1000}
              />
              <button type="submit" disabled={submitting || !content.trim()} className="btn-primary py-2 px-3 text-xs">
                {lang === 'ko' ? '전송' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {/* Nested replies with left border */}
        {getReplies(comment.id).length > 0 && (
          <div className="ml-8 sm:ml-11 border-l-2 pl-3" style={{ borderColor: 'var(--border)' }}>
            {getReplies(comment.id).map(r => <CommentItem key={r.id} comment={r} isReply />)}
          </div>
        )}
      </div>
    )
  }

  const postBtnLabel = submitting
    ? (lang === 'ko' ? '게시 중…' : 'Posting…')
    : (lang === 'ko' ? '댓글 게시' : 'Post Comment')

  return (
    <div>
      <h2 className="mb-5 flex items-center gap-2 text-base font-bold" style={{ color: 'var(--text-1)' }}>
        <MessageCircle className="h-4 w-4" style={{ color: 'var(--text-4)' }} />
        {lang === 'ko' ? '댓글' : 'Comments'}
        <span className="text-sm font-normal" style={{ color: 'var(--text-4)' }}>({comments.length})</span>
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
                placeholder={lang === 'ko' ? '댓글을 작성하세요…' : 'Write a comment…'}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>{content.length}/1000</span>
                <button type="submit" disabled={submitting || !content.trim()} className="btn-primary text-sm px-4 py-2">
                  {postBtnLabel}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="rounded-xl p-5 text-center mb-5" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
            {lang === 'ko' ? '댓글을 작성하려면 로그인하세요' : 'Log in to join the conversation'}
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/login" className="btn-primary text-sm px-4 py-2">
              {lang === 'ko' ? '로그인' : 'Log In'}
            </Link>
            <Link href="/register" className="btn-secondary text-sm px-4 py-2">
              {lang === 'ko' ? '회원가입' : 'Sign Up'}
            </Link>
          </div>
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : topLevel.length > 0 ? (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {topLevel.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="mb-2 text-3xl">💬</div>
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>
            {lang === 'ko' ? '아직 댓글이 없어요. 첫 댓글을 남겨보세요!' : 'No comments yet. Be the first!'}
          </p>
        </div>
      )}
    </div>
  )
}
