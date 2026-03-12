import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

// ── 카테고리 가중치: Community 50% ──
const CATEGORY_WEIGHTS = [
  { slug: 'free',        weight: 50 },
  { slug: 'jobs',        weight: 20 },
  { slug: 'realestate',  weight: 15 },
  { slug: 'marketplace', weight: 10 },
  { slug: 'info',        weight: 5  },
]

function weightedRandomCategory(): string {
  const total = CATEGORY_WEIGHTS.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const c of CATEGORY_WEIGHTS) {
    r -= c.weight
    if (r <= 0) return c.slug
  }
  return 'free'
}

// ── 12명 전체 페르소나 ──
const ALL_PERSONAS: Record<string, {
  name: string
  background: string
  voice: string
  preferredCategories?: string[]
}> = {
  jake_usa: {
    name: 'Jake',
    background: 'American software engineer, 3 years in Gangnam. Startup culture. Loves 치맥, hiking, and 편의점 snacks at midnight.',
    voice: 'Casual American. Short punchy sentences. "ngl", "tbh", "honestly though". Self-deprecating sometimes. Texas references.',
    preferredCategories: ['free', 'jobs', 'info'],
  },
  sophie_fr: {
    name: 'Sophie',
    background: 'French teacher at Hongik University. 2 years in Mapo. Passionate food opinions. Compares everything to France.',
    voice: 'Warm and thoughtful. Slightly formal. Genuine questions. Occasionally "oh là là" as humor. Good grammar but natural.',
    preferredCategories: ['free', 'info', 'realestate'],
  },
  alex_hk: {
    name: 'Alex',
    background: 'British financial analyst in Yeouido. Dry humor. Hikes Bukhansan on weekends. Misses proper pubs.',
    voice: 'Dry British wit. "quite", "rather", "brilliant", "fair enough". Understatement. Concise. Occasional sarcasm.',
    preferredCategories: ['jobs', 'realestate', 'free'],
  },
  yuki_jp: {
    name: 'Yuki',
    background: 'Japanese game designer. K-drama fan before Korea. Finds cultural similarities/differences fascinating. Works in Mapo.',
    voice: 'Enthusiastic and warm. Moderate emojis. Japan comparisons feel natural. "omg", "!!" occasionally.',
    preferredCategories: ['free', 'marketplace', 'info'],
  },
  linh_vn: {
    name: 'Linh',
    background: 'Vietnamese, Itaewon food stall owner. 4 years here. Knows every bargain in Seoul. Street-smart.',
    voice: 'Direct and practical. Tips and real prices. Gets to the point. "actually" a lot. No fluff.',
    preferredCategories: ['marketplace', 'free', 'realestate'],
  },
  priya_in: {
    name: 'Priya',
    background: 'Indian UX designer, fully remote. Yoga in Itaewon park. Very observational. Overthinks and admits it.',
    voice: 'Reflective storytelling. "honestly", "I feel like", "not gonna lie". Occasionally philosophical.',
    preferredCategories: ['free', 'info', 'jobs'],
  },
  marcus_us: {
    name: 'Marcus',
    background: 'Black American teacher in Busan. Music producer side hustle. Real and honest about the expat experience.',
    voice: 'Real, warm humor. AAVE naturally ("fam", "lowkey", "no cap"). Busan-specific. Doesn\'t sugarcoat.',
    preferredCategories: ['free', 'jobs', 'info'],
  },
  wei_cn: {
    name: 'Wei',
    background: 'Chinese PhD student at Yonsei. Urban economics. Gentrification nerd. Weekend field trips around Korea.',
    voice: 'Analytical but friendly. References patterns casually. Academic shows but doesn\'t lecture.',
    preferredCategories: ['realestate', 'info', 'free'],
  },
  ramyeon_lord: {
    name: 'ramyeon_lord',
    background: 'Australian in Seoul. Self-appointed Korean ramyeon reviewer.편의점 devotee. Moved from Melbourne. Very online humor.',
    voice: 'Internet-native humor. Tier lists, "W/L" takes. Casual but funny. Australian slang (mate, arvo, heaps). Self-aware about being a "food obsessed expat".',
    preferredCategories: ['free', 'marketplace', 'info'],
  },
  SeoulBound99: {
    name: 'SeoulBound99',
    background: 'Canadian, "just one year" turned 4 years. Marketing manager. Permanently confused by Korean bureaucracy but loves it anyway.',
    voice: 'Relatable and self-aware. Uses "at this point", "genuinely", "it do be like that". Humor about bureaucracy confusion.',
    preferredCategories: ['free', 'realestate', 'info'],
  },
  k_life_unplugged: {
    name: 'k_life_unplugged',
    background: 'German engineer turned ESL teacher. Documents chaos of expat life. Analytical German side vs chaotic Korea life.',
    voice: 'Dry, observational. German precision meeting Korean unpredictability. "interesting", clinical then surprised. Occasional German directness.',
    preferredCategories: ['jobs', 'free', 'info'],
  },
  itaewon_diaries: {
    name: 'itaewon_diaries',
    background: 'Brazilian in Seoul. Fashion and food focused. Eternal quest for good coffee. Vibrant social life. Colorful personality.',
    voice: 'Expressive and warm. "omg", "slay", "not me doing X". Occasional Portuguese words. Fashion and aesthetic references. Enthusiastic.',
    preferredCategories: ['free', 'marketplace', 'realestate'],
  },
}

const ALL_USERNAMES = Object.keys(ALL_PERSONAS)

// ── 카테고리별 주제 풀 (다양성 확보) ──
const TOPIC_POOL: Record<string, string[]> = {
  free: [
    'a funny cultural misunderstanding you had in Korea this week',
    'something about Korean convenience stores (편의점) that still amazes you',
    'your honest relationship with the 배달 app ecosystem',
    'a "only in Korea" moment from your recent daily life',
    'things you took for granted at home that you now miss in Korea',
    'how living in Korea changed how you see your home country',
    'your stages of learning Korean - current status and struggles',
    'a random act of kindness from a stranger in Korea',
    'the funniest thing that happened to you while speaking broken Korean',
    'comparing seasons/weather in Korea vs your home country',
    'Korean work culture observations (even if you\'re not working there)',
    'your first 노래방 experience or recent funny karaoke memory',
    'making Korean friends - honest experience and what worked',
    'a question or thing that confused you about Korean culture',
    'your neighborhood in Seoul/Korea and why you chose it',
    'Korean dating as a foreigner - observations or funny stories',
    'something you\'ve completely adopted from Korean culture that surprises even you',
    'a rant about something mildly frustrating (traffic, bureaucracy, noise, etc)',
    'comparison: Seoul neighborhood life vs your city back home',
    'a wholesome moment that made you fall more in love with Korea',
    'your 치맥 story or honest review of the experience',
    'Korean skincare / beauty culture observations as a foreigner',
    'the hierarchy/age culture in Korea - your learning curve',
    'Korean food you were scared to try but now can\'t live without',
    'asking for recommendations from the community',
    'a funny story about navigating Korean bureaucracy',
    'your experience at a Korean hospital or clinic',
    'public transport observations - things that impress or confuse you',
  ],
  jobs: [
    'your job search experience in Korea as a foreigner - honest review',
    'what a typical work day looks like at a Korean company',
    'the pros and cons of working at a Korean company vs foreign company',
    'your experience getting an E-7 visa or work visa - the real process',
    'freelancing from Korea - taxes, clients, practical tips',
    'industries where foreigners are actually finding jobs in Korea',
    'remote work from Korea setup and work-life balance reality',
    'Korean workplace culture shock moments (bowing, hierarchy, overtime)',
    'a networking tip or experience that actually worked for expats',
    'side hustles that work well while based in Korea',
    'your salary negotiation experience in Korea as a foreigner',
    'things nobody tells you about teaching English in Korea',
    'LinkedIn vs Korean job boards - which actually works for foreigners',
    'working with Korean colleagues - communication tips from experience',
    'a wild or funny work story from your Korean workplace',
    'career development in Korea - growing professionally as a foreigner',
  ],
  realestate: [
    'your apartment search journey as a foreigner - what you learned',
    'best neighborhoods in Seoul for expats under a specific budget',
    'the 전세 vs 월세 decision - what I chose and why',
    'dealing with Korean landlords - your experience (good or bad)',
    'tips for finding a room without speaking Korean fluently',
    'honest review of living in 고시원, 오피스텔, or regular 아파트',
    'things to check before signing a lease in Korea as a foreigner',
    'negotiating rent in Korea - what tactics worked',
    'area comparison: Mapo vs Mapo, or comparing two neighborhoods you\'ve lived',
    'moving to Korea: temporary accommodation tips for the first month',
    'the foreigner-friendly real estate agent question - how to find one',
    'a landlord or agent story that taught you something important',
  ],
  marketplace: [
    'selling items before leaving Korea - pricing and platform tips',
    'looking for a specific second-hand item (electronics, furniture, etc)',
    'your 당근마켓 (Daangn) experience as a foreigner - tips and funny stories',
    'comparing second-hand platforms: Daangn vs 번개장터 vs 중고나라',
    'great deals you found or where to look for specific things',
    'selling strategy: what sells fast on Korean second-hand apps',
    'a trade meeting story that was awkward or funny',
    'buying or selling electronics second-hand in Korea - what to know',
  ],
  info: [
    'step-by-step: renewing your ARC in 2026 - what changed',
    'opening a Korean bank account - which bank and how (from experience)',
    'Korean health insurance as a foreigner - what you actually paid',
    'useful apps every foreigner in Korea should know about',
    'navigating Korean tax filing as a foreign resident',
    'getting a Korean driver\'s license from a foreign one - process',
    'Korean public transport tips that took too long to figure out',
    'where to get official documents translated/notarized in Korea',
    'practical tips for sending money home from Korea',
    'the foreigners\' survival guide to Korean healthcare visits',
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
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.93,
        max_tokens: 800,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminSupabase()

  // 카테고리 선택 (가중치)
  const catSlug = weightedRandomCategory()
  const { data: cat } = await db.from('categories').select('id').eq('slug', catSlug).single()
  if (!cat) return NextResponse.json({ error: `Category ${catSlug} not found` }, { status: 400 })

  // 해당 카테고리를 선호하는 페르소나 중에서 우선 선택
  const preferredForCat = ALL_USERNAMES.filter(u => ALL_PERSONAS[u].preferredCategories?.includes(catSlug))
  const pool = preferredForCat.length >= 3 ? preferredForCat : ALL_USERNAMES
  const username = pool[Math.floor(Math.random() * pool.length)]

  const { data: profile } = await db.from('profiles').select('id, display_name').eq('username', username).single()
  if (!profile) return NextResponse.json({ error: `Persona ${username} not found. Run /api/seed first.` }, { status: 400 })

  const p = profile as { id: string; display_name: string }
  const persona = ALL_PERSONAS[username]

  // 주제 선택
  const topics = TOPIC_POOL[catSlug] ?? TOPIC_POOL.free
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const isHumor = catSlug === 'free' && Math.random() < 0.35

  const systemPrompt = `You are ${persona.name}, a foreigner living in Korea writing a community forum post.

BACKGROUND: ${persona.background}
WRITING VOICE: ${persona.voice}

HARD RULES — follow all of these:
1. Write like a REAL HUMAN. Banned AI phrases: "In conclusion", "It's worth noting", "delve", "navigate", "as a foreigner navigating", "tapestry", "bustling", "it's important to note".
2. NEVER include personal contact info. No emails, no Instagram handles, no phone numbers, no KakaoTalk IDs, no Discord tags.
3. Uncertain facts must be hedged. Use "I think", "from my experience", "someone correct me if I'm wrong", "not 100% sure".
4. No hashtags. No "Hope this helps!" endings.
5. Korean words are welcome where natural: 치맥, 편의점, 전세, 고시원, 아파트, 출입국, 아이고, etc.
6. Mix short and long sentences. Include one imperfect or self-aware moment.
7. Post length: 150-300 words of actual content.
${isHumor ? '8. Humor mode: funny, relatable, Reddit/community energy. Light self-roast OK.' : ''}

RESPOND with valid JSON only (no markdown):
{"title": "natural post title", "content": "<p>HTML content with p, strong, br tags</p>"}`

  const raw = await callGroq(systemPrompt, `Write a community post about: ${topic}`)
  if (!raw) return NextResponse.json({ error: 'Groq call failed' }, { status: 500 })

  let generated: { title: string; content: string } | null = null
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) generated = JSON.parse(match[0])
  } catch { /* ignore */ }

  if (!generated?.title || !generated?.content) {
    return NextResponse.json({ error: 'Parse failed', raw: raw.slice(0, 300) }, { status: 500 })
  }

  const { data: inserted, error } = await db.from('posts').insert({
    title: generated.title,
    content: generated.content,
    author_id: p.id,
    category_id: (cat as { id: number }).id,
    status: 'published',
    views_count: Math.floor(Math.random() * 15) + 1,
  }).select('id').single()

  if (error || !inserted) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  return NextResponse.json({
    success: true,
    post: { id: (inserted as { id: string }).id, title: generated.title, author: username, category: catSlug },
  })
}
