'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AdminPost, AdminUser, AdminReport } from './page'

type Tab = 'posts' | 'users' | 'reports'

export default function AdminClient({
  posts: initialPosts, postCount, users, reports,
}: {
  posts: AdminPost[]; postCount: number; users: AdminUser[]; reports: AdminReport[]
}) {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState(initialPosts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function deletePost(id: string) {
    if (!confirm('이 게시글을 삭제할까요?')) return
    setDeleting(id)
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts(p => p.filter(p => p.id !== id))
    setDeleting(null)
  }

  const filteredPosts = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.profiles?.username?.includes(search))
    : posts

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'posts', label: '게시글', count: postCount },
    { id: 'users', label: '회원', count: users.length },
    { id: 'reports', label: '신고', count: reports.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="page-container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-black" style={{ background: 'var(--primary)' }}>A</span>
            <span className="font-bold text-base" style={{ color: 'var(--text-1)' }}>관리자 패널</span>
          </div>
          <Link href="/" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-3)' }}>← 사이트로 돌아가기</Link>
        </div>
        <div className="page-container flex gap-1 pb-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={{
                borderColor: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--text-3)',
              }}
            >
              {t.label}
              <span className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold"
                style={{ background: tab === t.id ? 'var(--primary-light)' : 'var(--bg-alt)', color: tab === t.id ? 'var(--primary)' : 'var(--text-4)' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="page-container py-6 max-w-5xl">

        {/* ── 게시글 탭 ── */}
        {tab === 'posts' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="제목 또는 작성자 검색…"
                className="input-field flex-1 h-9 text-sm"
              />
              <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-4)' }}>총 {postCount}개</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filteredPosts.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {p.categories && (
                        <span className="badge-category text-xs">{p.categories.name}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </div>
                    <Link href={`/post/${p.id}`} target="_blank"
                      className="text-sm font-semibold line-clamp-1 hover:underline"
                      style={{ color: 'var(--text-1)' }}>
                      {p.title}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                      @{p.profiles?.username ?? '—'} · {new Date(p.created_at).toLocaleDateString('ko-KR')} · 조회 {p.views_count}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/submit?edit=${p.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium hover:bg-slate-50 transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                      수정
                    </Link>
                    <button
                      onClick={() => deletePost(p.id)}
                      disabled={deleting === p.id}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium hover:bg-red-50 transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                      {deleting === p.id ? '…' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && (
                <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>검색 결과가 없어요.</p>
              )}
            </div>
          </div>
        )}

        {/* ── 회원 탭 ── */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--primary)' }}>
                    {(u.display_name?.[0] ?? u.username[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{u.display_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>@{u.username} · 가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <Link href={`/profile/${u.username}`} target="_blank"
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--primary)' }}>
                    프로필 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 신고 탭 ── */}
        {tab === 'reports' && (
          <div className="card overflow-hidden">
            {reports.length === 0 ? (
              <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>신고된 게시글이 없어요.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {reports.map(r => (
                  <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/post/${r.post_id}`} target="_blank"
                          className="text-sm font-semibold hover:underline line-clamp-1"
                          style={{ color: 'var(--text-1)' }}>
                          {r.posts?.title ?? '(삭제된 게시글)'}
                        </Link>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{r.reason}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                          신고자: @{r.profiles?.username ?? '—'} · {new Date(r.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={() => deletePost(r.post_id)}
                        className="flex-shrink-0 inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium hover:bg-red-50"
                        style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                        글 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
