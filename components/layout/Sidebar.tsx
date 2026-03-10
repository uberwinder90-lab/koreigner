import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Category { id: number; name: string; slug: string }
interface PopularPost { id: string; title: string; views_count: number }

const CATEGORY_ICONS: Record<string, string> = {
  general: '💬',
  living: '🏠',
  food: '🍜',
  language: '📚',
  'work-visa': '💼',
  travel: '✈️',
  culture: '🎎',
  relationships: '💞',
  qa: '❓',
}

export default async function Sidebar() {
  const supabase = await createClient()

  const { data: catData } = await supabase.from('categories').select('*').order('name')
  const { data: postData } = await supabase
    .from('posts').select('id, title, views_count')
    .eq('status', 'published').order('views_count', { ascending: false }).limit(5)

  const categories = (catData ?? []) as unknown as Category[]
  const bestPosts = (postData ?? []) as unknown as PopularPost[]

  return (
    <aside className="space-y-4">
      {/* Write CTA */}
      <div
        className="rounded-2xl p-5 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
      >
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
          style={{ background: 'white' }}
        />
        <div
          className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <h3 className="text-base font-bold mb-1 relative">Share your story</h3>
        <p className="text-xs opacity-80 mb-4 relative">
          Connect with foreigners living in Korea
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all relative"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
        >
          ✏️ Write a Post
        </Link>
      </div>

      {/* Categories */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1"
          style={{ color: 'var(--text-4)' }}>
          Browse Topics
        </h3>
        <ul className="space-y-0.5">
          <li>
            <Link href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-alt)]"
              style={{ color: 'var(--text-2)' }}>
              <span>🌏</span>
              <span className="font-medium">All Posts</span>
            </Link>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <Link href={`/?category=${cat.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-alt)] hover:text-[var(--primary)]"
                style={{ color: 'var(--text-2)' }}>
                <span>{CATEGORY_ICONS[cat.slug] ?? '📌'}</span>
                <span>{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending */}
      {bestPosts.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1"
            style={{ color: 'var(--text-4)' }}>
            🔥 Trending
          </h3>
          <ul className="space-y-2">
            {bestPosts.map((post, i) => (
              <li key={post.id}>
                <Link href={`/post/${post.id}`}
                  className="flex gap-2.5 group hover:text-[var(--primary)] transition-colors">
                  <span className="flex-shrink-0 w-5 h-5 rounded text-xs font-bold flex items-center justify-center mt-0.5"
                    style={{ background: i === 0 ? '#fef3c7' : 'var(--bg-alt)', color: i === 0 ? '#92400e' : 'var(--text-4)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 leading-relaxed transition-colors"
                      style={{ color: 'var(--text-2)' }}>
                      {post.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                      {post.views_count} views
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Community Stats */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1"
          style={{ color: 'var(--text-4)' }}>Community</h3>
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-3)' }}>
          <p>🌍 Foreigners from 50+ countries</p>
          <p>💬 Share · Ask · Connect</p>
          <p>🇰🇷 Life in Korea made easier</p>
        </div>
      </div>
    </aside>
  )
}
