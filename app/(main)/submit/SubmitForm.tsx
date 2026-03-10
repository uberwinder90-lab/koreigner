'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Category {
  id: number
  name: string
  slug: string
}

interface PostMedia {
  id: string
  file_url: string
  display_order: number
}

interface EditPost {
  id: string
  title: string
  content: string | null
  category_id: number
  embedded_url: string | null
  post_media: PostMedia[]
}

interface Props {
  categories: Category[]
  editPost?: EditPost | null
}

export default function SubmitForm({ categories, editPost }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [content, setContent] = useState(editPost?.content ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(editPost?.category_id ?? '')
  const [embeddedUrl, setEmbeddedUrl] = useState(editPost?.embedded_url ?? '')
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    editPost?.post_media
      ?.sort((a, b) => a.display_order - b.display_order)
      .map((m) => m.file_url) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    const uploaded: string[] = []

    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        uploaded.push(data.url)
      }
    }

    setMediaUrls((prev) => [...prev, ...uploaded])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeMedia(idx: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('Title is required.'); return }
    if (!categoryId) { setError('Please select a category.'); return }

    setLoading(true)

    const body = {
      title: title.trim(),
      content: content.trim() || null,
      categoryId,
      embeddedUrl: embeddedUrl.trim() || null,
      mediaUrls,
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
      setError(data.error ?? 'Failed to submit.')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">
        {editPost ? 'Edit Post' : 'Write Post'}
      </h1>

      {error && <div className="alert-error">{error}</div>}

      {/* Category */}
      <div>
        <label className="label" htmlFor="category">Category <span className="text-danger">*</span></label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          className="input-field"
          required
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="label" htmlFor="title">Title <span className="text-danger">*</span></label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Enter a title…"
          maxLength={200}
          required
        />
        <p className="text-xs text-text-tertiary mt-1 text-right">{title.length}/200</p>
      </div>

      {/* Content */}
      <div>
        <label className="label" htmlFor="content">Content</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input-field resize-none"
          rows={10}
          placeholder="Write something…"
        />
      </div>

      {/* URL Embed */}
      <div>
        <label className="label" htmlFor="embeddedUrl">Link / Embed URL</label>
        <input
          id="embeddedUrl"
          type="url"
          value={embeddedUrl}
          onChange={(e) => setEmbeddedUrl(e.target.value)}
          className="input-field"
          placeholder="https://youtube.com/watch?v=... or any link"
        />
        <p className="text-xs text-text-tertiary mt-1">YouTube and Vimeo links will be embedded.</p>
      </div>

      {/* File Upload */}
      <div>
        <label className="label">Images / Videos</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm"
        >
          {uploading ? 'Uploading…' : '+ Add Files'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {mediaUrls.map((url, i) => {
              const isVideo = /\.(mp4|webm|ogg)$/i.test(url)
              return (
                <div key={i} className="relative group aspect-video bg-gray-100 rounded-md overflow-hidden">
                  {isVideo ? (
                    <video src={url} className="w-full h-full object-cover" muted />
                  ) : (
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading || uploading} className="btn-primary px-6">
          {loading ? 'Submitting…' : editPost ? 'Save Changes' : 'Publish Post'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
