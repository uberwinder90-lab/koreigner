import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

const PERSONA_USERNAMES = [
  'jake_usa', 'sophie_fr', 'alex_hk', 'yuki_jp',
  'linh_vn', 'priya_in', 'marcus_us', 'wei_cn',
]

const PERSONA_VOICE: Record<string, string> = {
  jake_usa:  'Casual American. Short sentences. Uses "lol", "honestly", "ngl", "tbh". Conversational.',
  sophie_fr: 'Warm, thoughtful. Slightly formal. Sometimes mentions French comparison. Genuine.',
  alex_hk:   'Dry British humor. Concise. Understatement. Uses "quite", "rather", "fair point".',
  yuki_jp:   'Enthusiastic, warm. Occasional emojis. Compares to Japan naturally.',
  linh_vn:   'Direct, practical. Gets to the point. Shares personal experience tips.',
  priya_in:  'Observational, storytelling style. Reflective. Uses "honestly" a lot.',
  marcus_us: 'Real and honest. Warm humor. Direct. Uses AAVE naturally.',
  wei_cn:    'Analytical but friendly. References observations or patterns casually.',
}

async function generateComment(
  postTitle: string,
  postContent: string,
  commenterUsername: string,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const voice = PERSONA_VOICE[commenterUsername] ?? 'casual and natural'
  const cleanContent = postContent.replace(/<[^>]+>/g, '').slice(0, 600)

  // 댓글 유형을 랜덤으로 선택하여 다양성 확보
  const commentTypes = [
    'agree and add your own similar experience',
    'ask a genuine follow-up question about something in the post',
    'share a different perspective or counter-experience (friendly, not argumentative)',
    'give a helpful tip or info that adds to what was posted',
    'relate with humor — a funny reaction or meme-energy reply',
  ]
  const commentType = commentTypes[Math.floor(Math.random() * commentTypes.length)]

  const prompt = `You are a foreigner living in Korea replying to a community forum post.

Your writing voice: ${voice}

The post you're replying to:
Title: "${postTitle}"
Content: "${cleanContent}"

Write a SHORT, NATURAL comment (1-4 sentences). Your task: ${commentType}

STRICT RULES:
- Sound like a REAL HUMAN. No "Great post!", no "I completely agree with your perspective", no AI phrases.
- NEVER include contact info (no email, Instagram, phone, KakaoTalk ID).
- NEVER state false facts as truth. Use hedging when uncertain ("I think", "from what I heard").
- No hashtags.
- Be relevant to the actual post content above.

Reply with ONLY the comment text. No quotes. No labels. Just the comment.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.92,
        max_tokens: 180,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminSupabase()

  // 최근 4시간 내의 게시글 찾기 (없으면 24시간으로 확장)
  let targetPost: { id: string; title: string; content: string | null; author_id: string } | null = null

  for (const hours of [4, 12, 24]) {
    const since = new Date(Date.now() - hours * 3600000).toISOString()
    const { data: posts } = await db
      .from('posts')
      .select('id, title, content, author_id')
      .eq('status', 'published')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(8)

    if (posts && posts.length > 0) {
      // 댓글이 적은 글 우선 선택 (활발한 대화 유도)
      targetPost = (posts as typeof posts)[Math.floor(Math.random() * Math.min(posts.length, 5))] as typeof targetPost
      break
    }
  }

  if (!targetPost) {
    return NextResponse.json({ error: 'No recent posts found to comment on' }, { status: 404 })
  }

  // 글 작성자와 다른 페르소나를 댓글 작성자로 선택
  const { data: postAuthorProfile } = await db
    .from('profiles')
    .select('username')
    .eq('id', targetPost.author_id)
    .single()

  const authorUsername = (postAuthorProfile as { username: string } | null)?.username ?? ''
  const availablePersonas = PERSONA_USERNAMES.filter(u => u !== authorUsername)
  const commenterUsername = availablePersonas[Math.floor(Math.random() * availablePersonas.length)]

  const { data: commenter } = await db
    .from('profiles')
    .select('id')
    .eq('username', commenterUsername)
    .single()

  if (!commenter) {
    return NextResponse.json({ error: `Commenter ${commenterUsername} not found. Run /api/seed first.` }, { status: 400 })
  }

  const commentText = await generateComment(
    targetPost.title,
    targetPost.content ?? '',
    commenterUsername,
  )

  if (!commentText) {
    return NextResponse.json({ error: 'Comment generation failed. Check GROQ_API_KEY.' }, { status: 500 })
  }

  const { error } = await db.from('comments').insert({
    post_id: targetPost.id,
    author_id: (commenter as { id: string }).id,
    content: commentText,
    parent_id: null,
    status: 'published',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    comment: {
      on_post: targetPost.title.slice(0, 60),
      by: commenterUsername,
      preview: commentText.slice(0, 100),
    },
  })
}
