import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

// 페르소나별 댓글 목소리 (20명)
const PERSONA_VOICE: Record<string, string> = {
  jake_usa:          'Casual American. Short. Uses "ngl", "tbh", "honestly". Doesn\'t overthink.',
  sophie_fr:         'Warm and thoughtful. Real. Genuine. Occasionally adds a personal connection.',
  alex_hk:           'Dry British wit. Concise. Slight sarcasm that reads as sincere.',
  yuki_jp:           'Enthusiastic and genuinely curious. Compares to Japan sometimes. Warm.',
  linh_vn:           'Blunt and practical. Gets to the point. Real prices or tips when relevant.',
  priya_in:          'Reflective. "Honestly", "I feel like". Thoughtful, sometimes overthinks.',
  marcus_us:         'Real and warm. Doesn\'t sugarcoat. Friendly but direct.',
  wei_cn:            'Analytical but accessible. Notices patterns. Brief.',
  tom_wilson:        'Straightforward. Casual. Short. "for real tho".',
  emma_au:           'Dry Australian humor. Self-aware. "heaps", "no worries".',
  dmitri_ru:         'Concise and observational. Occasionally wry.',
  sara_kA:           'Self-aware humor about being between cultures. Warm.',
  ramyeon_lord:      'Internet-native. Tier list energy. Casual and funny.',
  SeoulBound99:      'Relatable. "at this point", "genuinely". Humor about Korea chaos.',
  k_life_unplugged:  'Dry, slightly clinical then surprised. German directness.',
  itaewon_diaries:   'Expressive. "omg", enthusiastic. Fashion/aesthetic references.',
  noodles_in_seoul:  'Food-obsessed but real about expat life. Warm opinions.',
  expat_in_progress: 'Openly confused sometimes. Self-deprecating. "help?" energy.',
  hongdae_hannah:    'Creative and observational. Notices small details. Warm.',
  korea_by_accident: 'Wry "how did I end up here" energy. Warm and domestic.',
}

const ALL_USERNAMES = Object.keys(PERSONA_VOICE)

const COMMENT_TYPES = [
  'agree and add something short from your own experience',
  'ask a genuine follow-up question',
  'offer a different perspective or counter-experience',
  'give a quick practical tip related to the post',
  'a short funny or relatable reaction',
]

async function callGroq(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.96,
        max_tokens: 200,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() ?? null
  } catch { return null }
}

async function postComment(
  db: ReturnType<typeof import('@/lib/supabase/admin').getAdminSupabase>,
  postId: string,
  authorId: string,
  content: string
) {
  const minutesAgo = Math.floor(Math.random() * 120) + 5
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
  const { error } = await db.from('comments').insert({
    post_id: postId,
    author_id: authorId,
    content,
    created_at: createdAt,
  })
  return !error
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminSupabase()

  // 최근 게시글 찾기 (4시간 → 12시간 → 24시간)
  let recentPost: { id: string; author_id: string; title: string; content: string } | null = null
  for (const hours of [4, 12, 24]) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString()
    const { data } = await db
      .from('posts')
      .select('id, author_id, title, content')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data && data.length > 0) {
      // 댓글이 적은 글 우선
      const withCount = await Promise.all(
        data.map(async (p) => {
          const { count } = await db.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id)
          return { ...p, commentCount: count ?? 0 }
        })
      )
      withCount.sort((a, b) => a.commentCount - b.commentCount)
      const least = withCount.slice(0, Math.min(5, withCount.length))
      recentPost = least[Math.floor(Math.random() * least.length)] as { id: string; author_id: string; title: string; content: string }
      break
    }
  }

  if (!recentPost) return NextResponse.json({ message: 'No recent posts found' })

  // 게시글당 이번 호출에서 달 댓글 수 결정: 0~3개 (가중치)
  const commentCountRoll = Math.random()
  let commentCount: number
  if (commentCountRoll < 0.25) commentCount = 0
  else if (commentCountRoll < 0.60) commentCount = 1
  else if (commentCountRoll < 0.85) commentCount = 2
  else commentCount = 3

  if (commentCount === 0) {
    return NextResponse.json({ message: 'Skipped this round (0 comments)' })
  }

  // 게시글 작성자와 다른 페르소나들 선택
  const { data: authorProfile } = await db.from('profiles').select('username').eq('id', recentPost.author_id).single()
  const authorUsername = (authorProfile as { username?: string } | null)?.username ?? ''
  const eligible = ALL_USERNAMES.filter(u => u !== authorUsername)

  const used = new Set<string>()
  const results: { commenter: string; ok: boolean }[] = []

  for (let i = 0; i < commentCount; i++) {
    const available = eligible.filter(u => !used.has(u))
    if (available.length === 0) break
    const commenter = available[Math.floor(Math.random() * available.length)]
    used.add(commenter)

    const { data: commenterProfile } = await db.from('profiles').select('id').eq('username', commenter).single()
    if (!commenterProfile) continue

    const voice = PERSONA_VOICE[commenter]
    const commentType = COMMENT_TYPES[Math.floor(Math.random() * COMMENT_TYPES.length)]
    const postSnippet = recentPost.content.replace(/<[^>]+>/g, '').slice(0, 200)

    const systemPrompt = `You are writing a short comment on a community forum post (like Reddit). You are ${commenter}.
VOICE: ${voice}

CRITICAL RULES:
1. Write ENTIRELY in natural English. Do NOT insert Korean words mid-sentence.
2. 1-3 sentences MAX. Be concise.
3. Sound like a real person — not an AI. Banned phrases: "It's worth noting", "I must say", "Great post!", "Absolutely", "Certainly".
4. No hashtags. No contact info. No sign-off.
5. Type: ${commentType}`

    const raw = await callGroq(systemPrompt, `Post: "${recentPost.title}" — ${postSnippet}`)
    if (!raw) continue

    const ok = await postComment(db, recentPost.id, (commenterProfile as { id: string }).id, raw)
    results.push({ commenter, ok })
  }

  return NextResponse.json({
    success: true,
    post: { id: recentPost.id, title: recentPost.title },
    commentsAttempted: commentCount,
    results,
  })
}
