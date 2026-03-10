import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'

interface Profile {
  id: string
  username: string
  display_name: string
  profile_image_url: string | null
  created_at: string
}

interface PostRow {
  id: string
  title: string
  created_at: string
  views_count: number
}

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  return { title: `@${username}'s Profile` }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!data) notFound()
  const profile = data as unknown as Profile

  const { data: postsData } = await supabase
    .from('posts')
    .select('id, title, created_at, views_count')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)

  const posts = (postsData ?? []) as unknown as PostRow[]

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-light border-2 border-border flex-shrink-0 relative">
            {profile.profile_image_url ? (
              <Image
                src={profile.profile_image_url}
                alt={profile.display_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                {profile.display_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{profile.display_name}</h1>
            <p className="text-sm text-text-tertiary">@{profile.username}</p>
            <p className="text-xs text-text-tertiary mt-1">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-base font-semibold text-text-primary mb-3">
          Posts ({posts.length})
        </h2>
        {posts.length > 0 ? (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="card p-4 flex items-center justify-between hover:border-primary/30 transition-colors block"
              >
                <span className="text-sm text-text-primary hover:text-primary transition-colors line-clamp-1">
                  {post.title}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3 text-xs text-text-tertiary">
                  <span>{post.views_count} views</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-text-tertiary text-sm">
            No posts yet.
          </div>
        )}
      </div>
    </div>
  )
}
