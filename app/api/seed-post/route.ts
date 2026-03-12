import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

// Protect endpoint
function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

// Persona usernames to randomly pick from (must exist in DB after /api/seed is run)
const PERSONA_USERNAMES = [
  'jake_usa', 'sophie_fr', 'alex_hk', 'yuki_jp',
  'linh_vn', 'priya_in', 'marcus_us', 'wei_cn',
]

const CATEGORY_SLUGS = ['free', 'jobs', 'realestate', 'marketplace', 'info']

// Context hints per category for better prompts
const CATEGORY_PROMPTS: Record<string, string> = {
  free: 'daily life, culture, experiences, observations about living in Korea as a foreigner',
  jobs: 'job searching, job offers, career advice, working in Korea, visa sponsorship',
  realestate: 'finding apartments, rent prices, neighborhoods, housing tips in Korea',
  marketplace: 'buying or selling second-hand items, electronics, furniture, household goods in Korea',
  info: 'practical information, tips, guides about visas, banking, healthcare, or bureaucratic processes in Korea',
}

async function generatePostWithGroq(categorySlug: string, personaName: string): Promise<{ title: string; content: string } | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const categoryHint = CATEGORY_PROMPTS[categorySlug] ?? 'life in Korea as a foreigner'

  const prompt = `You are ${personaName}, a foreigner living in Seoul, Korea. Write a realistic community forum post about: ${categoryHint}.

Rules:
- Write as if you are a real person sharing genuine experience or information
- Mix Korean words naturally (e.g., 전세, ARC, 외국인등록증, 편의점) where relevant
- Keep it conversational and helpful, 150-300 words
- Can be in English or Korean or mixed, depending on topic
- No hashtags, no emojis overuse
- Format as plain paragraphs (you may use <p>, <strong>, <br/> HTML tags)

Respond ONLY with a JSON object like this (no markdown, no extra text):
{"title": "post title here", "content": "<p>post body here</p>"}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? ''

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.title || !parsed.content) return null
    return { title: String(parsed.title), content: String(parsed.content) }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminSupabase()

  // Pick random persona
  const username = PERSONA_USERNAMES[Math.floor(Math.random() * PERSONA_USERNAMES.length)]
  const { data: profile } = await db.from('profiles').select('id, display_name').eq('username', username).single()
  if (!profile) {
    return NextResponse.json({ error: `Persona ${username} not found. Run /api/seed first.` }, { status: 400 })
  }
  const p = profile as { id: string; display_name: string }

  // Pick random category
  const catSlug = CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)]
  const { data: cat } = await db.from('categories').select('id').eq('slug', catSlug).single()
  if (!cat) {
    return NextResponse.json({ error: `Category ${catSlug} not found.` }, { status: 400 })
  }
  const catId = (cat as { id: number }).id

  // Generate post content via Groq
  const generated = await generatePostWithGroq(catSlug, p.display_name)
  if (!generated) {
    return NextResponse.json({ error: 'Groq generation failed. Check GROQ_API_KEY.' }, { status: 500 })
  }

  // Insert post
  const { data: inserted, error } = await db.from('posts').insert({
    title: generated.title,
    content: generated.content,
    author_id: p.id,
    category_id: catId,
    status: 'published',
    views_count: Math.floor(Math.random() * 10),
  }).select('id').single()

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    post: {
      id: (inserted as { id: string }).id,
      title: generated.title,
      author: p.display_name,
      category: catSlug,
    },
  })
}
