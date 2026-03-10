'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Category { id: number; name: string; slug: string }
interface PostMedia { id: string; file_url: string; display_order: number }
interface EditPost {
  id: string; title: string; content: string | null
  category_id: number; embedded_url: string | null; post_media: PostMedia[]
}
interface Props { categories: Category[]; editPost?: EditPost | null }

interface UploadItem {
  url: string
  name: string
  type: 'image' | 'video'
  uploading?: boolean
  error?: string
}

export default function SubmitForm({ categories, editPost }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [content, setContent] = useState(editPost?.content ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(editPost?.category_id ?? '')
  const [embeddedUrl, setEmbeddedUrl] = useState(editPost?.embedded_url ?? '')
  const [items, setItems] = useState<UploadItem[]>(
    editPost?.post_media
      ?.sort((a, b) => a.display_order - b.display_order)
      .map(m => ({
        url: m.file_url,
        name: m.file_url.split('/').pop() ?? 'file',
        type: /\.(mp4|webm|ogg)$/i.test(m.file_url) ? 'video' : 'image',
      })) ?? []
  )
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const uploadFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(f => {
      if (f.size > 50 * 1024 * 1024) {
        setError(`"${f.name}" exceeds the 50MB limit.`)
        return false
      }
      return true
    })
    if (!validFiles.length) return

    // 즉시 placeholder 추가
    const placeholders: UploadItem[] = validFiles.map(f => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type.startsWith('video/') ? 'video' : 'image',
      uploading: true,
    }))
    setItems(prev => [...prev, ...placeholders])

    // 업로드
    const results = await Promise.all(
      validFiles.map(async (file, i) => {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (res.ok) {
          const data = await res.json()
          return { url: data.url, name: file.name, type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video', uploading: false }
        }
        return { url: placeholders[i].url, name: file.name, type: placeholders[i].type, uploading: false, error: 'Upload failed' }
      })
    )

    // placeholder를 실제 결과로 교체
    setItems(prev => {
      const newItems = [...prev]
      const startIdx = newItems.findIndex(it => it.uploading)
      if (startIdx >= 0) {
        newItems.splice(startIdx, results.length, ...results)
      }
      return newItems
    })
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadFiles(files)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (files.length) uploadFiles(files)
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!categoryId) { setError('Please select a category.'); return }
    if (items.some(it => it.uploading)) { setError('Please wait for all files to finish uploading.'); return }
    if (items.some(it => it.error)) { setError('Some files failed to upload. Please remove them and try again.'); return }

    setLoading(true)
    const body = {
      title: title.trim(),
      content: content.trim() || null,
      categoryId,
      embeddedUrl: embeddedUrl.trim() || null,
      mediaUrls: items.map(it => it.url),
    }

    const url = editPost ? `/api/posts/${editPost.id}` : '/api/posts'
    const method = editPost ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit. Please try again.')
      return
    }

    if (editPost) {
      router.push(`/post/${editPost.id}`)
    } else {
      const data = await res.json()
      router.push(`/post/${data.postId}`)
    }
    router.refresh()
  }

  const isUploading = items.some(it => it.uploading)

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
          {editPost ? 'Edit Post' : 'Write a Post'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Share your experience, tips, or questions with the community
        </p>
      </div>

      {error && (
        <div className="alert-error mb-5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="card p-5">
          <label className="label" htmlFor="category">
            Category <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="input-field"
            required
          >
            <option value="">Select a category…</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Title + Content */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label" htmlFor="title">
              Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="title" type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field text-base font-medium"
              placeholder="What's on your mind?"
              maxLength={200} required
            />
            <p className="text-xs mt-1 text-right" style={{ color: title.length > 180 ? 'var(--danger)' : 'var(--text-4)' }}>
              {title.length}/200
            </p>
          </div>
          <div>
            <label className="label" htmlFor="content">Content</label>
            <textarea
              id="content" value={content}
              onChange={e => setContent(e.target.value)}
              className="input-field resize-none leading-relaxed"
              rows={12}
              placeholder="Write your post here…&#10;&#10;You can share stories, ask questions, give tips or anything about life in Korea."
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-4)' }}>
              {content.length} characters
            </p>
          </div>
        </div>

        {/* Media Upload */}
        <div className="card p-5">
          <label className="label mb-3">
            Photos & Videos
            <span className="font-normal ml-1.5" style={{ color: 'var(--text-4)' }}>(optional, max 50MB each)</span>
          </label>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className={`upload-zone ${dragging ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--primary-light)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
              {dragging ? 'Drop files here' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>
              PNG, JPG, GIF, WebP, MP4, WebM · up to 50MB
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Preview Grid */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
              {items.map((item, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-alt)' }}>
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                  )}
                  {/* Uploading overlay */}
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  {/* Error overlay */}
                  {item.error && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white text-center p-1"
                      style={{ background: 'rgba(239,68,68,0.8)' }}>
                      Failed
                    </div>
                  )}
                  {/* Remove button */}
                  {!item.uploading && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.7)' }}
                    >
                      ✕
                    </button>
                  )}
                  {/* Type badge */}
                  {item.type === 'video' && !item.uploading && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/60 rounded px-1 py-0.5">
                      VIDEO
                    </span>
                  )}
                </div>
              ))}
              {/* Add more */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-4)' }}
              >
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          )}
        </div>

        {/* Link Embed */}
        <div className="card p-5">
          <label className="label" htmlFor="embeddedUrl">
            Link / Embed URL
            <span className="font-normal ml-1.5" style={{ color: 'var(--text-4)' }}>(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4" style={{ color: 'var(--text-4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              id="embeddedUrl" type="url" value={embeddedUrl}
              onChange={e => setEmbeddedUrl(e.target.value)}
              className="input-field pl-10"
              placeholder="https://youtube.com/watch?v=... or any URL"
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-4)' }}>
            YouTube and Vimeo links will be automatically embedded.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-2">
          <button
            type="submit"
            disabled={loading || isUploading}
            className="btn-primary px-7 py-3"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Publishing…
              </>
            ) : isUploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Uploading files…
              </>
            ) : (
              editPost ? '💾 Save Changes' : '🚀 Publish Post'
            )}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary px-5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
