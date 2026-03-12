'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { AdminPost, AdminUser, AdminReport } from './page'

type Tab = 'posts' | 'comments' | 'users' | 'reports' | 'banner'

interface AdminComment {
  id: string
  content: string
  created_at: string
  status: string
  author_id: string
  post_id: string
  profiles: { username: string; display_name: string } | null
  posts: { title: string } | null
}

interface SiteBanner {
  id: string
  title: string
  subtitle: string | null
  link_url: string | null
  bg_color: string
  text_color: string
  is_active: boolean
  is_popup: boolean
  created_at: string
}

export default function AdminClient({
  posts: initialPosts, postCount, users, reports,
}: {
  posts: AdminPost[]; postCount: number; users: AdminUser[]; reports: AdminReport[]
}) {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState(initialPosts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Comments
  const [comments, setComments] = useState<AdminComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  // Banners
  const [banners, setBanners] = useState<SiteBanner[]>([])
  const [bannersLoading, setBannersLoading] = useState(false)
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', link_url: '', bg_color: '#2563eb', text_color: '#ffffff', is_active: true, is_popup: false,
  })
  const [bannerSaving, setBannerSaving] = useState(false)
  const [editingBanner, setEditingBanner] = useState<string | null>(null)

  async function deletePost(id: string) {
    if (!confirm('이 게시글을 삭제할까요?')) return
    setDeleting(id)
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts(p => p.filter(p => p.id !== id))
    setDeleting(null)
  }

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    const res = await fetch('/api/admin/comments')
    if (res.ok) setComments(await res.json())
    setCommentsLoading(false)
  }, [])

  const loadBanners = useCallback(async () => {
    setBannersLoading(true)
    const res = await fetch('/api/admin/banner')
    if (res.ok) setBanners(await res.json())
    setBannersLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'comments' && comments.length === 0) loadComments()
    if (tab === 'banner' && banners.length === 0) loadBanners()
  }, [tab, comments.length, banners.length, loadComments, loadBanners])

  async function deleteComment(id: string) {
    if (!confirm('이 댓글을 삭제할까요?')) return
    setDeleting(id)
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    setComments(c => c.filter(c => c.id !== id))
    setDeleting(null)
  }

  async function saveCommentEdit(id: string) {
    if (!editCommentText.trim()) return
    const res = await fetch(`/api/comments?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editCommentText }),
    })
    if (res.ok) {
      setComments(c => c.map(c => c.id === id ? { ...c, content: editCommentText } : c))
      setEditingComment(null)
    }
  }

  async function saveBanner() {
    setBannerSaving(true)
    if (editingBanner) {
      await fetch(`/api/admin/banner?id=${editingBanner}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      })
      setBanners(b => b.map(bn => bn.id === editingBanner ? { ...bn, ...bannerForm } : bn))
      setEditingBanner(null)
    } else {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      })
      if (res.ok) {
        const created = await res.json()
        setBanners(b => [created, ...b])
      }
    }
    setBannerForm({ title: '', subtitle: '', link_url: '', bg_color: '#2563eb', text_color: '#ffffff', is_active: true, is_popup: false })
    setBannerSaving(false)
  }

  async function deleteBanner(id: string) {
    if (!confirm('이 배너를 삭제할까요?')) return
    await fetch(`/api/admin/banner?id=${id}`, { method: 'DELETE' })
    setBanners(b => b.filter(bn => bn.id !== id))
  }

  async function toggleBanner(id: string, is_active: boolean) {
    await fetch(`/api/admin/banner?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    setBanners(b => b.map(bn => bn.id === id ? { ...bn, is_active } : bn))
  }

  function startEditBanner(bn: SiteBanner) {
    setEditingBanner(bn.id)
    setBannerForm({
      title: bn.title,
      subtitle: bn.subtitle ?? '',
      link_url: bn.link_url ?? '',
      bg_color: bn.bg_color,
      text_color: bn.text_color,
      is_active: bn.is_active,
      is_popup: bn.is_popup,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredPosts = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.profiles?.username?.includes(search))
    : posts

  const tabs: { id: Tab; label: string; count: number | null }[] = [
    { id: 'posts', label: '게시글', count: postCount },
    { id: 'comments', label: '댓글', count: comments.length || null },
    { id: 'users', label: '회원', count: users.length },
    { id: 'reports', label: '신고', count: reports.length },
    { id: 'banner', label: '배너', count: null },
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
              {t.count !== null && (
                <span className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{ background: tab === t.id ? 'var(--primary-light)' : 'var(--bg-alt)', color: tab === t.id ? 'var(--primary)' : 'var(--text-4)' }}>
                  {t.count}
                </span>
              )}
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
                      @{p.profiles?.username ?? '—'} · {new Date(p.created_at).toLocaleDateString('ko-KR')}
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

        {/* ── 댓글 탭 ── */}
        {tab === 'comments' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>최근 댓글 목록</span>
              <button onClick={loadComments} className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>새로고침</button>
            </div>
            {commentsLoading ? (
              <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>불러오는 중…</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {comments.length === 0 && (
                  <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>댓글이 없어요.</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>@{c.profiles?.username ?? '—'}</span>
                          <span className="text-xs" style={{ color: 'var(--text-4)' }}>·</span>
                          <Link href={`/post/${c.post_id}`} target="_blank"
                            className="text-xs line-clamp-1 hover:underline max-w-[200px]"
                            style={{ color: 'var(--primary)' }}>
                            {c.posts?.title ?? '게시글 보기'}
                          </Link>
                          <span className="text-xs" style={{ color: 'var(--text-4)' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {editingComment === c.id ? (
                          <div className="flex gap-2 mt-1">
                            <textarea
                              value={editCommentText}
                              onChange={e => setEditCommentText(e.target.value)}
                              className="input-field flex-1 text-sm resize-none"
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => saveCommentEdit(c.id)}
                                className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-white"
                                style={{ background: 'var(--primary)' }}>
                                저장
                              </button>
                              <button
                                onClick={() => setEditingComment(null)}
                                className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{c.content}</p>
                        )}
                      </div>
                      {editingComment !== c.id && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setEditingComment(c.id); setEditCommentText(c.content) }}
                            className="inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium hover:bg-slate-50"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                            수정
                          </button>
                          <button
                            onClick={() => deleteComment(c.id)}
                            disabled={deleting === c.id}
                            className="inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium hover:bg-red-50"
                            style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                            {deleting === c.id ? '…' : '삭제'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* ── 배너 탭 ── */}
        {tab === 'banner' && (
          <div className="space-y-6">
            {/* 배너 등록/수정 폼 */}
            <div className="card p-6">
              <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                {editingBanner ? '배너 수정' : '새 배너 등록'}
              </h2>

              {/* 미리보기 */}
              {bannerForm.title && (
                <div
                  className="rounded-xl p-4 mb-5 flex items-center gap-3"
                  style={{ background: bannerForm.bg_color, color: bannerForm.text_color }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{bannerForm.title}</p>
                    {bannerForm.subtitle && <p className="text-xs opacity-80 mt-0.5">{bannerForm.subtitle}</p>}
                  </div>
                  {bannerForm.link_url && (
                    <span className="text-xs font-medium opacity-80 underline">자세히 보기</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">제목 *</label>
                  <input
                    value={bannerForm.title}
                    onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="예: 비자 정보 업데이트됐어요!"
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">부제목 (선택)</label>
                  <input
                    value={bannerForm.subtitle}
                    onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="예: 2026년 F-4 비자 기준 확인하세요"
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">링크 URL (선택)</label>
                  <input
                    value={bannerForm.link_url}
                    onChange={e => setBannerForm(f => ({ ...f, link_url: e.target.value }))}
                    placeholder="https://..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">배경색</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bannerForm.bg_color}
                      onChange={e => setBannerForm(f => ({ ...f, bg_color: e.target.value }))}
                      className="h-10 w-16 rounded cursor-pointer border" style={{ borderColor: 'var(--border)' }}
                    />
                    <input value={bannerForm.bg_color}
                      onChange={e => setBannerForm(f => ({ ...f, bg_color: e.target.value }))}
                      className="input-field flex-1 font-mono text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">글자색</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bannerForm.text_color}
                      onChange={e => setBannerForm(f => ({ ...f, text_color: e.target.value }))}
                      className="h-10 w-16 rounded cursor-pointer border" style={{ borderColor: 'var(--border)' }}
                    />
                    <input value={bannerForm.text_color}
                      onChange={e => setBannerForm(f => ({ ...f, text_color: e.target.value }))}
                      className="input-field flex-1 font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={bannerForm.is_active}
                      onChange={e => setBannerForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>활성화</span>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" checked={bannerForm.is_popup}
                      onChange={e => setBannerForm(f => ({ ...f, is_popup: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>팝업으로 띄우기</span>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={saveBanner}
                  disabled={bannerSaving || !bannerForm.title.trim()}
                  className="btn-primary h-10 px-5 text-sm"
                >
                  {bannerSaving ? '저장 중…' : editingBanner ? '수정 완료' : '배너 등록'}
                </button>
                {editingBanner && (
                  <button
                    onClick={() => { setEditingBanner(null); setBannerForm({ title: '', subtitle: '', link_url: '', bg_color: '#2563eb', text_color: '#ffffff', is_active: true, is_popup: false }) }}
                    className="h-10 px-5 text-sm rounded-xl border font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                  >
                    취소
                  </button>
                )}
              </div>
            </div>

            {/* 배너 목록 */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>등록된 배너</span>
                <button onClick={loadBanners} className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>새로고침</button>
              </div>
              {bannersLoading ? (
                <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>불러오는 중…</p>
              ) : banners.length === 0 ? (
                <p className="p-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>등록된 배너가 없어요.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {banners.map(bn => (
                    <div key={bn.id} className="p-4 flex items-start gap-4">
                      <div
                        className="flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium w-32 truncate text-center"
                        style={{ background: bn.bg_color, color: bn.text_color }}
                      >
                        {bn.title}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{bn.title}</p>
                        {bn.subtitle && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{bn.subtitle}</p>}
                        {bn.link_url && <p className="text-xs truncate" style={{ color: 'var(--primary)' }}>{bn.link_url}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer" title={bn.is_active ? '비활성화' : '활성화'}>
                          <input type="checkbox" checked={bn.is_active}
                            onChange={e => toggleBanner(bn.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <button onClick={() => startEditBanner(bn)}
                          className="inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium hover:bg-slate-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                          수정
                        </button>
                        <button onClick={() => deleteBanner(bn.id)}
                          className="inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium hover:bg-red-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
