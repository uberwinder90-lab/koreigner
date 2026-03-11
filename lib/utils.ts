import { formatDistanceToNow } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'

export function timeAgo(date: string | Date, lang: 'ko' | 'en' = 'ko'): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: lang === 'ko' ? ko : enUS })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url)
}

export function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  )
  return match ? match[1] : null
}

export function getEmbedHtml(url: string): string | null {
  const youtubeId = getYoutubeId(url)
  if (youtubeId) {
    return `<iframe src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen class="w-full aspect-video rounded-md"></iframe>`
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen class="w-full aspect-video rounded-md"></iframe>`
  }
  return null
}

export function generateVerificationCode(): string {
  const array = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    return String(array[0] % 1000000).padStart(6, '0')
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
}
