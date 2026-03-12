'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLang } from '@/lib/i18n'

interface Category { id: number; name: string; slug: string }
interface PostMedia { id: string; file_url: string; display_order: number }
interface EditPost {
  id: string; title: string; content: string | null
  category_id: number; embedded_url: string | null; post_media: PostMedia[]
}
interface Props { categories: Category[]; editPost?: EditPost | null }

interface UploadedFile {
  id: string
  url: string
  localUrl: string
  type: 'image' | 'video'
  name: string
  uploading: boolean
  error: string
}

function uid() { return Math.random().toString(36).slice(2) }

type FormatAction = 'bold' | 'italic' | 'strike' | 'code' | 'quote' | 'ul' | 'ol' | 'h3' | 'link'

function applyFormat(textarea: HTMLTextAreaElement, action: FormatAction, url?: string) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const sel = text.slice(start, end)
  let before = '', after = '', replacement = sel

  switch (action) {
    case 'bold':      before = '**'; after = '**'; replacement = sel || 'bold text'; break
    case 'italic':    before = '*';  after = '*';  replacement = sel || 'italic text'; break
    case 'strike':    before = '~~'; after = '~~'; replacement = sel || 'strikethrough'; break
    case 'code':
      if (sel.includes('\n')) { before = '```\n'; after = '\n```' }
      else { before = '`'; after = '`' }
      replacement = sel || 'code'; break
    case 'quote':
      before = '\n> '; after = ''
      replacement = (sel || 'quote').split('\n').join('\n> '); break
    case 'ul':
      before = '\n'
      replacement = (sel || 'List item').split('\n').map(l => `- ${l}`).join('\n')
      after = '\n'; break
    case 'ol':
      before = '\n'
      replacement = (sel || 'List item').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
      after = '\n'; break
    case 'h3':
      before = '\n### '; after = ''
      replacement = sel || 'Heading'; break
    case 'link': {
      const href = url || prompt('Enter URL:')
      if (href) { before = '['; after = `](${href})`; replacement = sel || 'link text' }
      break
    }
  }

  const newValue = text.slice(0, start) + before + replacement + after + text.slice(end)
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  nativeInputValueSetter?.call(textarea, newValue)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.setSelectionRange(start + before.length, start + before.length + replacement.length)
  textarea.focus()
  return newValue
}

// Reddit-style: [video](url) and ![](url) → inline media (must run before link replacement)
function markdownToHtml(md: string): string {
  const blockToHtml = (block: string): string => {
    const t = block.trim()
    if (!t) return ''
    if (/^\[video\]\((https?:\S+)\)$/i.test(t))
      return `<figure class="post-inline-media"><video src="${t.replace(/^\[video\]\((https?:\S+)\)$/i, '$1')}" controls class="w-full rounded-xl max-h-[70vh] object-contain" style="background:#000"></video></figure>`
    if (/^!\[([^\]]*)\]\((https?:\S+)\)$/.test(t)) {
      const m = t.match(/^!\[([^\]]*)\]\((https?:\S+)\)$/)!
      return `<figure class="post-inline-media"><img src="${m[2]}" alt="${m[1] || ''}" class="w-full rounded-xl" loading="lazy" /></figure>`
    }
    const inner = t
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/```[\s\S]*?```/g, (m) => `<pre><code>${m.slice(3, -3).trim()}</code></pre>`)
      .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br />')
    return `<p>${inner}</p>`
  }
  return md.split(/\n\n+/).map(blockToHtml).filter(Boolean).join('')
}

// Block-based editor: content = array of text | image | video (blog-style)
type ContentBlock = { id: string; type: 'text' | 'image' | 'video'; content: string; size?: 'small' | 'medium' | 'large' }

function htmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const figRegex = /<figure[^>]*class="([^"]*post-inline-media[^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi
  let lastEnd = 0
  let m: RegExpExecArray | null
  const decode = (s: string) => s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  while ((m = figRegex.exec(html)) !== null) {
    const textHtml = html.slice(lastEnd, m.index)
    const textContent = decode(textHtml)
    if (textContent) blocks.push({ id: uid(), type: 'text', content: textContent })
    const figContent = m[2]
    const fullClass = m[1] ?? ''
    const sizeClass = fullClass.match(/post-img-(small|medium|large)/i)
    const size = (sizeClass?.[1]?.toLowerCase() as 'small'|'medium'|'large') || 'large'
    if (figContent.includes('<video')) {
      const src = figContent.match(/src="([^"]+)"/)?.[1] ?? ''
      if (src) blocks.push({ id: uid(), type: 'video', content: src, size })
    } else {
      const src = figContent.match(/src="([^"]+)"/)?.[1] ?? ''
      if (src) blocks.push({ id: uid(), type: 'image', content: src, size })
    }
    lastEnd = figRegex.lastIndex
  }
  const tail = html.slice(lastEnd)
  const tailContent = decode(tail)
  if (tailContent) blocks.push({ id: uid(), type: 'text', content: tailContent })
  if (blocks.length === 0) blocks.push({ id: uid(), type: 'text', content: '' })
  return blocks
}

function blocksToHtml(blocks: ContentBlock[]): string {
  const out: string[] = []
  for (const b of blocks) {
    if (b.type === 'text') {
      const t = b.content.trim()
      if (t) out.push(markdownToHtml(t))
    } else if (b.type === 'image') {
      const sizeClass = b.size && b.size !== 'large' ? ` post-img-${b.size}` : ''
      out.push(`<figure class="post-inline-media${sizeClass}"><img src="${b.content}" alt="" class="w-full rounded-xl" loading="lazy" /></figure>`)
    } else if (b.type === 'video') {
      const sizeClass = b.size && b.size !== 'large' ? ` post-img-${b.size}` : ''
      out.push(`<figure class="post-inline-media${sizeClass}"><video src="${b.content}" controls class="w-full rounded-xl max-h-[70vh] object-contain" style="background:#000"></video></figure>`)
    }
  }
  return out.join('')
}

function ToolBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors hover:bg-[var(--bg-alt)]"
      style={{ color: 'var(--text-3)' }}
    >
      {children}
    </button>
  )
}

export default function SubmitForm({ categories, editPost }: Props) {
  const router = useRouter()
  const { t } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)
  const inlineImageRef = useRef<HTMLInputElement>(null)
  const inlineVideoRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    if (editPost?.content) return htmlToBlocks(editPost.content)
    return [{ id: uid(), type: 'text', content: '' }]
  })
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<number | ''>(editPost?.category_id ?? '')
  const [linkUrl, setLinkUrl] = useState(editPost?.embedded_url ?? '')
  const [showLinkField, setShowLinkField] = useState(!!editPost?.embedded_url)
  const [files, setFiles] = useState<UploadedFile[]>(
    editPost?.post_media?.sort((a, b) => a.display_order - b.display_order).map(m => ({
      id: uid(), url: m.file_url, localUrl: m.file_url,
      type: /\.(mp4|webm)$/i.test(m.file_url) ? 'video' : 'image',
      name: m.file_url.split('/').pop() ?? 'file', uploading: false, error: '',
    })) ?? []
  )
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const focusedBlock = blocks.find(b => b.id === focusedBlockId)
  const focusedIndex = blocks.findIndex(b => b.id === focusedBlockId)

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }
  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }
  function insertBlocksAfter(index: number, newBlocks: ContentBlock[]) {
    setBlocks(prev => [...prev.slice(0, index + 1), ...newBlocks, ...prev.slice(index + 1)])
  }

  useEffect(() => {
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [blocks])

  const uploadFiles = useCallback(async (rawFiles: File[]) => {
    const allowed = rawFiles.filter(f => f.size <= 50 * 1024 * 1024)
    if (allowed.length < rawFiles.length) setError('Some files exceed 50MB and were skipped.')

    const placeholders: UploadedFile[] = allowed.map(f => ({
      id: uid(), url: '', localUrl: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
      name: f.name, uploading: true, error: '',
    }))
    setFiles(prev => [...prev, ...placeholders])

    await Promise.all(placeholders.map(async (ph, i) => {
      const form = new FormData()
      form.append('file', allowed[i])
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      setFiles(prev => prev.map(f =>
        f.id === ph.id
          ? { ...f, uploading: false, url: res.ok ? data.url : '', error: res.ok ? '' : (data.error ?? 'Upload failed') }
          : f
      ))
    }))
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (dropped.length) uploadFiles(dropped)
  }

  async function uploadAndInsertInline(files: FileList | null, type: 'image' | 'video') {
    if (!files?.length) return
    const file = files[0]
    const isVideo = type === 'video' || file.type.startsWith('video/')
    if (file.size > 50 * 1024 * 1024) { setError('File must be under 50MB.'); return }
    setError('')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Upload failed.'); return }
    const url = data.url as string
    const mediaBlock: ContentBlock = { id: uid(), type: isVideo ? 'video' : 'image', content: url, size: 'large' }
    const textBlock: ContentBlock = { id: uid(), type: 'text', content: '' }
    const idx = focusedIndex >= 0 ? focusedIndex : blocks.length - 1
    const at = blocks[idx]
    if (at?.type === 'text' && textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = at.content
      const before = text.slice(0, start)
      const after = text.slice(end)
      setBlocks(prev => {
        const next = [...prev]
        const current = prev[idx] as ContentBlock
        next[idx] = { ...current, content: before }
        next.splice(idx + 1, 0, mediaBlock, { ...textBlock, content: after })
        return next
      })
      setFocusedBlockId(textBlock.id)
    } else {
      insertBlocksAfter(idx, [mediaBlock, textBlock])
      setFocusedBlockId(textBlock.id)
    }
    if (inlineImageRef.current) inlineImageRef.current.value = ''
    if (inlineVideoRef.current) inlineVideoRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('Title is required.'); return }
    if (!categoryId) { setError('Please select a category.'); return }
    if (files.some(f => f.uploading)) { setError('Please wait for uploads to complete.'); return }
    if (files.some(f => f.error)) { setError('Some uploads failed. Remove them and try again.'); return }

    setLoading(true)

    const htmlContent = blocksToHtml(blocks)

    const body = {
      title: title.trim(),
      content: htmlContent || null,
      categoryId: Number(categoryId),
      embeddedUrl: showLinkField ? (linkUrl.trim() || null) : null,
      mediaUrls: files.filter(f => f.url).map(f => f.url),
    }

    const url = editPost ? `/api/posts/${editPost.id}` : '/api/posts'
    const method = editPost ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to publish. Please try again.')
      return
    }

    router.push(editPost ? `/post/${editPost.id}` : `/post/${data.postId}`)
    router.refresh()
  }

  const isUploading = files.some(f => f.uploading)

  return (
    <div className="max-w-2xl mx-auto">
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => {
        const f = Array.from(e.target.files ?? [])
        if (f.length) uploadFiles(f)
      }} />
      <input ref={inlineImageRef} type="file" accept="image/*" className="hidden" onChange={e => uploadAndInsertInline(e.target.files, 'image')} />
      <input ref={inlineVideoRef} type="file" accept="video/*" className="hidden" onChange={e => uploadAndInsertInline(e.target.files, 'video')} />

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {editPost ? t.editPost : t.createPost}
          </h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary py-2 px-4 text-sm">
              {t.cancel}
            </button>
            <button type="submit" disabled={loading || isUploading} className="btn-primary py-2 px-5 text-sm">
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> {t.posting}</>
                : isUploading ? t.uploading
                : editPost ? t.saveChanges : t.post}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* Category selector */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>K</div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{t.postTo}</p>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="input-field py-1.5 text-sm font-semibold" required>
              <option value="">{t.chooseCommunity}</option>
              {categories.map(cat => {
                // Use i18n name when available (shows Community/House/Information based on lang)
                const label = (t as Record<string, string>)[cat.slug] ?? cat.name
                return <option key={cat.id} value={cat.id}>{label}</option>
              })}
            </select>
          </div>
        </div>

        {/* Main editor card */}
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4">

            {/* Title */}
            <div>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full outline-none text-base font-semibold py-2 px-0 border-b-2 bg-transparent transition-colors"
                style={{ color: 'var(--text-1)', borderColor: title ? 'var(--primary)' : 'var(--border)' }}
                placeholder={t.titleLabel}
                maxLength={300} required
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>{t.titleHint}</span>
                <span className={`text-xs ${title.length > 270 ? 'text-red-500' : ''}`}
                  style={{ color: title.length > 270 ? undefined : 'var(--text-4)' }}>
                  {title.length}/300
                </span>
              </div>
            </div>

            {/* 한 영역 글쓰기 (레딧처럼: 툴바 + 본문/이미지가 한 흐름) */}
            <div className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div
                className="flex items-center gap-0.5 px-2 py-1.5 border-b"
                style={{ background: 'var(--bg-alt)', borderColor: 'var(--border)', borderRadius: '10px 10px 0 0' }}
              >
                <ToolBtn title="Bold (Ctrl+B)" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'bold') }) }}><strong>B</strong></ToolBtn>
                <ToolBtn title="Italic (Ctrl+I)" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'italic') }) }}><em>I</em></ToolBtn>
                <ToolBtn title="Strikethrough" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'strike') }) }}><s>S</s></ToolBtn>
                <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                <ToolBtn title="Heading" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'h3') }) }}>H</ToolBtn>
                <ToolBtn title="Blockquote" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'quote') }) }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                </ToolBtn>
                <ToolBtn title="Code" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'code') }) }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </ToolBtn>
                <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                <ToolBtn title="Bullet list" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'ul') }) }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                </ToolBtn>
                <ToolBtn title="Numbered list" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'ol') }) }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </ToolBtn>
                <ToolBtn title="Link" onClick={() => { if (focusedBlockId && focusedBlock?.type === 'text' && textareaRef.current) updateBlock(focusedBlockId, { content: applyFormat(textareaRef.current, 'link') }) }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </ToolBtn>
                <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                <ToolBtn title="Insert image (inline)" onClick={() => inlineImageRef.current?.click()}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </ToolBtn>
                <ToolBtn title="Insert video (inline)" onClick={() => inlineVideoRef.current?.click()}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </ToolBtn>
                <div className="flex-1" />
                <button type="button" onClick={() => setPreview(v => !v)}
                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${preview ? 'text-[var(--primary)] bg-[var(--primary-light)]' : 'hover:bg-white'}`}
                  style={{ color: preview ? undefined : 'var(--text-4)' }}>
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>

              {preview ? (
                <div
                  className="min-h-[120px] p-4 rounded-b-lg border prose-content"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                  dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks) || '<p style="color:var(--text-4)">Nothing to preview.</p>' }}
                />
              ) : (
                <div className="min-h-[280px]">
                  {blocks.map((block) => {
                    if (block.type === 'text') {
                      const isFocused = block.id === focusedBlockId
                      return (
                        <div key={block.id} className="border-b border-[var(--border)] last:border-b-0">
                          <textarea
                            ref={isFocused ? textareaRef : undefined}
                            value={block.content}
                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                            onFocus={() => setFocusedBlockId(block.id)}
                            onKeyDown={e => {
                              if (e.ctrlKey || e.metaKey) {
                                if (e.key === 'b') { e.preventDefault(); updateBlock(block.id, { content: applyFormat(e.currentTarget, 'bold') }) }
                                if (e.key === 'i') { e.preventDefault(); updateBlock(block.id, { content: applyFormat(e.currentTarget, 'italic') }) }
                              }
                            }}
                            placeholder={blocks.length > 1 ? '이어서 작성…' : '글을 작성하세요. 위에서 이미지/영상 버튼으로 본문에 바로 삽입할 수 있습니다.'}
                            className="w-full resize-none outline-none px-4 py-3 text-sm leading-relaxed"
                            style={{
                              color: 'var(--text-2)',
                              minHeight: '100px',
                              background: 'transparent',
                              border: 'none',
                            }}
                          />
                        </div>
                      )
                    }
                    if (block.type === 'image') {
                      return (
                        <div key={block.id} className="relative group py-2 border-b border-[var(--border)] last:border-b-0">
                          <div className={`relative w-full aspect-[4/3] ${block.size === 'small' ? 'max-w-[33%]' : block.size === 'medium' ? 'max-w-[60%] mx-auto' : ''}`}>
                            <Image src={block.content} alt="" fill className="object-contain rounded-lg" unoptimized sizes="(max-width:768px) 100vw, 600px" />
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={block.size ?? 'large'}
                              onChange={e => updateBlock(block.id, { size: e.target.value as 'small'|'medium'|'large' })}
                              className="text-xs rounded-lg border px-2 py-1 bg-white/95 shadow"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                            <button type="button" onClick={() => removeBlock(block.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs bg-black/60 hover:bg-red-600">✕</button>
                          </div>
                        </div>
                      )
                    }
                    if (block.type === 'video') {
                      return (
                        <div key={block.id} className="relative group py-2 border-b border-[var(--border)] last:border-b-0">
                          <div className={`relative w-full ${block.size === 'small' ? 'max-w-[33%] mx-auto' : block.size === 'medium' ? 'max-w-[60%] mx-auto' : ''}`}>
                            <video src={block.content} controls className="w-full rounded-lg max-h-[50vh] object-contain bg-black" />
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={block.size ?? 'large'}
                              onChange={e => updateBlock(block.id, { size: e.target.value as 'small'|'medium'|'large' })}
                              className="text-xs rounded-lg border px-2 py-1 bg-white/95 shadow"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                            <button type="button" onClick={() => removeBlock(block.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs bg-black/60 hover:bg-red-600">✕</button>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
              <p className="text-xs px-4 py-2 border-t" style={{ color: 'var(--text-4)', borderColor: 'var(--border)' }}>
                한 영역에서 글 쓰다가 이미지/영상 버튼을 누르면 여기 본문에 바로 삽입됩니다. 크기는 미디어에 마우스를 올려 조절하세요.
              </p>
            </div>

            {/* Media upload section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>
                  Photos & Videos
                </p>
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>optional · max 50MB each</span>
              </div>

              {/* Drop zone */}
              <div
                className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={e => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragging(false) }}
                onDrop={onDrop}
                style={{ padding: '20px', minHeight: 'unset' }}
              >
                <div className="flex items-center gap-3 justify-center">
                  <svg className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>
                      {dragging ? 'Drop here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>PNG, JPG, GIF, WebP, MP4, WebM</p>
                  </div>
                </div>
              </div>

              {/* Uploaded files grid */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {files.map((f, i) => (
                    <div key={f.id} className="relative group rounded-xl overflow-hidden aspect-square"
                      style={{ background: 'var(--bg-alt)' }}>
                      {f.type === 'video' ? (
                        <video src={f.url || f.localUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <Image src={f.url || f.localUrl} alt="" fill className="object-cover" unoptimized />
                      )}
                      {f.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.85)' }}>
                          <svg className="w-7 h-7 animate-spin mb-1" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t.uploading}</span>
                        </div>
                      )}
                      {f.error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2"
                          style={{ background: 'rgba(239,68,68,0.85)' }}>
                          <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs text-white text-center">{f.error}</span>
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        {i + 1}
                      </div>
                      {!f.uploading && (
                        <button type="button"
                          onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          style={{ background: 'rgba(0,0,0,0.65)' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-4)' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add more
                  </button>
                </div>
              )}
            </div>

            {/* Link section (toggle) */}
            <div>
              <button
                type="button"
                onClick={() => { setShowLinkField(v => !v); if (showLinkField) setLinkUrl('') }}
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: showLinkField ? 'var(--primary)' : 'var(--text-4)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {showLinkField ? 'Remove link' : 'Add a link'}
              </button>
              {showLinkField && (
                <div className="mt-2 space-y-1.5">
                  <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    className="input-field text-sm"
                    placeholder="https://…" />
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                    YouTube and Vimeo links will be embedded automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posting guidelines */}
        <div className="card p-4">
          <h3 className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>
            Posting Guidelines
          </h3>
          <ul className="text-xs space-y-1" style={{ color: 'var(--text-3)' }}>
            <li>✅ Be respectful and kind to other members</li>
            <li>✅ Share relevant content for foreigners in Korea</li>
            <li>✅ Use the correct community category</li>
            <li>❌ No spam, hate speech, or personal attacks</li>
          </ul>
        </div>
      </form>
    </div>
  )
}
