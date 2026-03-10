import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Category {
  id: number
  name: string
  slug: string
}

interface PopularPost {
  id: string
  title: string
  views_count: number
}

export default async function Sidebar() {
  const supabase = await createClient()

  const { data: catData } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const { data: postData } = await supabase
    .from('posts')
    .select('id, title, views_count')
    .eq('status', 'published')
    .order('views_count', { ascending: false })
    .limit(5)

  const categories = (catData ?? []) as unknown as Category[]
  const bestPosts = (postData ?? []) as unknown as PopularPost[]

  return (
    <aside className="space-y-4">
      {/* Categories */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
          Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              className="block text-sm text-text-secondary hover:text-primary hover:bg-primary-light px-2 py-1.5 rounded transition-colors"
            >
              All Posts
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/?category=${cat.slug}`}
                className="block text-sm text-text-secondary hover:text-primary hover:bg-primary-light px-2 py-1.5 rounded transition-colors"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular Posts */}
      {bestPosts.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
            Popular Posts
          </h3>
          <ul className="space-y-2">
            {bestPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/post/${post.id}`}
                  className="block text-sm text-text-secondary hover:text-primary transition-colors line-clamp-2"
                >
                  {post.title}
                </Link>
                <span className="text-xs text-text-tertiary">{post.views_count} views</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Write Post CTA */}
      <div className="card p-4 bg-primary-light border-primary/20">
        <h3 className="text-sm font-semibold text-primary mb-1">Share Your Story</h3>
        <p className="text-xs text-text-secondary mb-3">
          Connect with other foreigners in Korea.
        </p>
        <Link href="/submit" className="btn-primary w-full text-center block text-xs py-2">
          Write Post
        </Link>
      </div>
    </aside>
  )
}
