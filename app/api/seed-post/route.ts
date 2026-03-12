import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

const CATEGORY_WEIGHTS = [
  { slug: 'free',        weight: 50 },
  { slug: 'jobs',        weight: 20 },
  { slug: 'realestate',  weight: 15 },
  { slug: 'marketplace', weight: 10 },
  { slug: 'info',        weight: 5  },
]

function weightedRandomCategory() {
  const total = CATEGORY_WEIGHTS.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const c of CATEGORY_WEIGHTS) { r -= c.weight; if (r <= 0) return c.slug }
  return 'free'
}

// ── 20명 다양한 페르소나 ──
const ALL_PERSONAS: Record<string, { background: string; voice: string; preferredCategories?: string[] }> = {
  seouldrifter88:   { background: 'American software engineer, 3 years in Gangnam. Works at a startup, loves hiking on weekends.', voice: 'Casual American. Short punchy sentences. Uses "ngl", "tbh". Occasionally self-deprecating.', preferredCategories: ['free','jobs','info'] },
  fromageseoul:     { background: 'French teacher at Hongik University. Passionate food opinions. Has been in Korea 2 years.', voice: 'Warm, thoughtful. Genuine. Sometimes wonders if she\'s been here too long. Good storyteller.', preferredCategories: ['free','info','realestate'] },
  propercuppa:      { background: 'British financial analyst in Yeouido. Dry humor. Hikes on weekends. Misses proper pubs.', voice: 'Dry British wit. Concise. Understates everything. Occasional sarcasm reads as sincere.', preferredCategories: ['jobs','realestate','free'] },
  pixelyuki:        { background: 'Japanese game designer. K-drama fan. Works in Mapo. Finds cultural differences fascinating.', voice: 'Enthusiastic. Uses emojis sometimes. Genuinely curious. Compares things to Japan naturally.', preferredCategories: ['free','marketplace','info'] },
  pho4seoul:        { background: 'Vietnamese, runs small food stall in Itaewon. 4 years here. Knows every bargain spot in Seoul.', voice: 'Blunt and practical. Gets straight to the point. Shares real prices and tips.', preferredCategories: ['marketplace','free','realestate'] },
  chai2soju:        { background: 'Indian UX designer, fully remote. Does yoga. Very observational about expat life.', voice: 'Reflective storytelling style. "Honestly", "I feel like". Occasionally overthinks and admits it.', preferredCategories: ['free','info','jobs'] },
  busanbeats:       { background: 'Black American English teacher in Busan. Music producer on weekends. Very real and honest.', voice: 'Real, warm humor. Doesn\'t sugarcoat. Busan-specific observations. Friendly but direct.', preferredCategories: ['free','jobs','info'] },
  urbanwei:         { background: 'Chinese PhD student at Yonsei studying urban economics. Analytical. Travels Korea on weekends.', voice: 'Analytical but accessible. References patterns casually. Academic background shows but doesn\'t lecture.', preferredCategories: ['realestate','info','free'] },
  maprotom:         { background: 'American from Chicago, works in marketing at a Korean company. 2 years in Mapo. Gym rat.', voice: 'Straightforward American. Casual. Doesn\'t overthink. Short posts. "honestly", "for real tho".', preferredCategories: ['free','jobs'] },
  emlb:             { background: 'Australian copywriter, remote work. Moved to Seoul for a "one year adventure". Now year 3.', voice: 'Dry Australian humor. "heaps", "no worries". Self-aware about being stuck in Korea.', preferredCategories: ['free','realestate','marketplace'] },
  dimakr:           { background: 'Russian data scientist in Seoul. Quietly observational. Finds Korea fascinating from a distance.', voice: 'Concise. Observational. Slightly formal but genuinely curious. Occasional wry humor.', preferredCategories: ['info','jobs','free'] },
  twopassports:     { background: 'Korean-American who moved "back" to Korea. Navigating the awkward in-between identity.', voice: 'Self-aware humor about being "too American" in Korea. Relatable to others in between cultures.', preferredCategories: ['free','info'] },
  ramyeonirl:       { background: 'Australian in Seoul. Self-appointed Korean instant noodle reviewer. Convenience store devotee.', voice: 'Internet-native humor. Tier lists, hot takes. Casual but funny. Self-aware about food obsession.', preferredCategories: ['free','marketplace'] },
  seoulbound99:     { background: 'Canadian, "just one year" turned 4 years. Marketing manager. Confused by bureaucracy but loves Korea.', voice: 'Relatable and self-aware. "at this point", "genuinely", "it be like that". Humor about bureaucracy.', preferredCategories: ['free','realestate','info'] },
  klifediary:       { background: 'German engineer turned ESL teacher. Documents chaos of expat life. German precision meets Korean chaos.', voice: 'Dry, observational. Clinical then surprised. Occasional German directness.', preferredCategories: ['jobs','free','info'] },
  itaewondiary:     { background: 'Brazilian in Seoul. Fashion and food focused. Very social. Colorful personality.', voice: 'Expressive. "omg", enthusiastic. Fashion and aesthetic references.', preferredCategories: ['free','marketplace','realestate'] },
  seoulnoodlekid:   { background: 'American foodie who came for a food tour, got a job, stayed. Now a food content creator.', voice: 'Food-obsessed but also real about expat life. Warm and funny. Shares opinions freely.', preferredCategories: ['free','marketplace'] },
  stillxpat:        { background: 'South African in Seoul. Still figuring everything out. Documents the learning curve honestly.', voice: 'Openly admits when confused. "help?", "am I doing this right?". Self-deprecating and endearing.', preferredCategories: ['free','info','realestate'] },
  hannahhd:         { background: 'British illustrator, lives in Hongdae for the art scene. Part of the indie culture crowd.', voice: 'Creative and observational. Notices small details. Warm humor. References local Seoul things.', preferredCategories: ['free','marketplace'] },
  accidentalkorean: { background: 'New Zealander who came for 3 months, married a Korean person, stayed. Now very domestic.', voice: 'Wry humor about the unexpected life path. "how did I end up here" energy. Warm.', preferredCategories: ['free','realestate','info'] },
}

const ALL_USERNAMES = Object.keys(ALL_PERSONAS)

// ── 길이 설정 (랜덤) ──
function getPostLength(): { label: string; instruction: string } {
  const r = Math.random()
  if (r < 0.20) return { label: 'micro', instruction: 'Write 1-2 sentences only. Could be just a question, a one-liner observation, or a quick share. No intro, no conclusion. Just the thing.' }
  if (r < 0.50) return { label: 'short', instruction: 'Write 3-6 sentences. A quick thought, experience, or question. No need for headers or lists.' }
  if (r < 0.80) return { label: 'medium', instruction: 'Write 2-4 short paragraphs. A real story or experience with some detail. Conversational.' }
  return { label: 'long', instruction: 'Write 4-8 paragraphs. A detailed experience, a guide from personal experience, or a longer rant/appreciation. Still conversational, not formal.' }
}

// ── 글 유형 (Reddit 스타일 다양화) ──
const POST_FORMATS = [
  'a personal experience or story',
  'a question to the community',
  'a tip or piece of advice from experience',
  'a rant (keep it light, not bitter)',
  'a positive observation or appreciation post',
  'an honest review of something (place, service, app)',
  'a "only in Korea" observation',
  'asking for recommendations',
  'a "hot take" or opinion that might spark discussion',
  'a life update post ("so I finally did X...")',
  'a comparison between Korea and home country',
  'a funny story',
]

const TOPIC_POOL: Record<string, string[]> = {
  free: [
    'adjusting to life in Korea as a foreigner',
    'something surprising about Korean culture',
    'making friends in Korea',
    'language barrier moments',
    'Korean work culture observations',
    'food discoveries in Korea',
    'neighborhood life in Seoul',
    'using Korean apps and services',
    'Korean seasons and weather',
    'Korean dating and social life',
    'expat community in Korea',
    'navigating Korean bureaucracy',
    'going back home after Korea',
    'what you miss from home',
    'what you love about Korea',
    'random Seoul observations',
    'public transport in Korea',
    'weekend activities in Korea',
    'Korean skincare and beauty culture',
    'the "빨리빨리" fast culture',
    'night life in Korea',
    'coffee shops and cafe culture',
    'holidays and festivals in Korea',
    'learning Korean language',
    'safety and cleanliness in Korea',
    'delivery app culture in Korea',
    'Korean convenience stores',
    'karaoke and entertainment culture',
  ],
  jobs: [
    'job hunting as a foreigner in Korea',
    'working at a Korean company',
    'work visa process in Korea',
    'freelancing from Korea',
    'teaching English in Korea',
    'Korean workplace culture',
    'salary and benefits in Korea',
    'career growth as a foreigner',
    'networking in Korea',
    'remote work from Korea',
    'finding jobs without Korean fluency',
    'comparing Korean vs foreign companies',
  ],
  realestate: [
    'apartment hunting in Korea as a foreigner',
    'understanding jeonse and wolse system',
    'best neighborhoods in Seoul',
    'dealing with landlords in Korea',
    'moving to Korea housing tips',
    'short-term rentals and first month in Korea',
    'negotiating rent as a foreigner',
    'living in different Seoul neighborhoods',
  ],
  marketplace: [
    'selling before leaving Korea',
    'buying second-hand in Korea',
    'using Korean second-hand apps',
    'looking for specific items in Seoul',
    'tips for second-hand shopping',
  ],
  info: [
    'ARC (alien registration card) process',
    'opening a bank account in Korea',
    'Korean health insurance for foreigners',
    'useful apps for living in Korea',
    'public transport tips in Korea',
    'getting a Korean driver\'s license',
    'tax filing as a foreigner in Korea',
  ],
}

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
        temperature: 0.94,
        max_tokens: 900,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminSupabase()
  const catSlug = weightedRandomCategory()
  const { data: cat } = await db.from('categories').select('id').eq('slug', catSlug).single()
  if (!cat) return NextResponse.json({ error: `Category ${catSlug} not found` }, { status: 400 })

  // 해당 카테고리 선호 페르소나 우선
  const preferred = ALL_USERNAMES.filter(u => ALL_PERSONAS[u].preferredCategories?.includes(catSlug))
  const pool = preferred.length >= 3 ? preferred : ALL_USERNAMES
  const username = pool[Math.floor(Math.random() * pool.length)]

  const { data: profile } = await db.from('profiles').select('id').eq('username', username).single()
  if (!profile) return NextResponse.json({ error: `Persona ${username} not in DB. Run /api/seed.` }, { status: 400 })

  const persona = ALL_PERSONAS[username]
  const topics = TOPIC_POOL[catSlug] ?? TOPIC_POOL.free
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const format = POST_FORMATS[Math.floor(Math.random() * POST_FORMATS.length)]
  const { instruction: lengthInstruction } = getPostLength()

  const systemPrompt = `You are writing a post for an online expat community forum (like Reddit) for foreigners living in Korea.

PERSONA: ${persona.background}
VOICE: ${persona.voice}

LENGTH: ${lengthInstruction}
POST FORMAT: Write this as ${format}.

CRITICAL RULES — these make or break realism:
1. Write ENTIRELY in natural English. Do NOT insert Korean words mid-sentence (no "the 편의점 near me", no "a 한국어-speaking friend"). If a Korean concept has no English equivalent, you may use it ONLY when it flows completely naturally (like mentioning "norebang" or "jimjilbang" as proper nouns, not mid-clause).
2. Sound like a REAL PERSON on Reddit/community forum. Banned phrases: "It's worth noting", "In conclusion", "delve into", "navigate", "as a foreigner navigating", "tapestry", "bustling", "foster", "landscape".
3. NEVER include contact info: no email, Instagram, phone, KakaoTalk, Discord.
4. Express uncertainty naturally: "I think", "from my experience", "could be wrong about this".
5. No hashtags. No formal sign-offs.
6. Titles should be real forum titles: questions, statements, casual hooks. No clickbait.

RESPOND with JSON only:
{"title": "post title", "content": "<p>content in HTML p/strong/br tags</p>"}`

  const raw = await callGroq(systemPrompt, `Topic: ${topic}`)
  if (!raw) return NextResponse.json({ error: 'Groq call failed. Check GROQ_API_KEY in Vercel env.' }, { status: 500 })

  let generated: { title: string; content: string } | null = null
  try {
    const match = raw.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/)
    if (match) generated = JSON.parse(match[0])
  } catch { /* ignore */ }

  if (!generated?.title || !generated?.content) {
    return NextResponse.json({ error: 'JSON parse failed', raw: raw.slice(0, 400) }, { status: 500 })
  }

  const { data: inserted, error } = await db.from('posts').insert({
    title: generated.title,
    content: generated.content,
    author_id: (profile as { id: string }).id,
    category_id: (cat as { id: number }).id,
    status: 'published',
    views_count: Math.floor(Math.random() * 20) + 1,
  }).select('id').single()

  if (error || !inserted) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  return NextResponse.json({
    success: true,
    post: { id: (inserted as { id: string }).id, title: generated.title, author: username, category: catSlug },
  })
}
