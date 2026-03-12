import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-seed-secret') === process.env.SEED_SECRET
}

// ── 카테고리 가중치: Community 50%, Jobs 20%, House 15%, Marketplace 10%, Info 5% ──
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

const PERSONA_USERNAMES = [
  'jake_usa', 'sophie_fr', 'alex_hk', 'yuki_jp',
  'linh_vn', 'priya_in', 'marcus_us', 'wei_cn',
]

// 각 페르소나의 배경과 말투 정의
const PERSONA_DETAILS: Record<string, { name: string; background: string; voice: string }> = {
  jake_usa: {
    name: 'Jake',
    background: 'American software engineer, living in Gangnam for 3 years. Loves 치맥 and hiking, slightly addicted to 편의점 snacks. Works at a startup, dealing with Korean work culture.',
    voice: 'Very casual American. Uses "lol", "ngl", "tbh", "honestly though". Short punchy sentences. Occasionally self-deprecating. References his Texas hometown. Not afraid to admit when he has no clue.',
  },
  sophie_fr: {
    name: 'Sophie',
    background: 'French teacher at Hongik University. Has lived in Korea 2 years. Passionate about food comparisons between France and Korea. Finds Korean directness refreshing. Goes to Hongdae cafes to grade papers.',
    voice: 'Warm and thoughtful. Slightly more formal than Americans. Occasionally compares things to France. Asks genuine questions. Uses "oh là là" humorously. Good grammar but conversational.',
  },
  alex_hk: {
    name: 'Alex',
    background: 'British financial analyst in Yeouido. Moved from London. Dry British sense of humor. Weekends hiking Bukhansan. Finds Korea\'s efficiency impressive but misses British pubs.',
    voice: 'Dry British wit. Uses "quite", "rather", "brilliant", "bloody". Understates everything. Short, punchy comments. Occasional sarcasm that reads as sincere. Very British humor.',
  },
  yuki_jp: {
    name: 'Yuki',
    background: 'Japanese game designer. K-drama fan before moving here. Finds the cultural similarities and surprising differences between Japan and Korea fascinating. Works at a small game studio in Mapo.',
    voice: 'Enthusiastic and warm. Uses emojis occasionally (not excessively). Comparisons to Japan are natural. Polite but casual. Gets genuinely excited about K-culture. Uses "omg" and "!!" sometimes.',
  },
  linh_vn: {
    name: 'Linh',
    background: 'Vietnamese, running a small food stall in Itaewon. Practical mindset. Knows every bargain spot in Seoul. Been here 4 years. Network of other SE Asian expats. Street-smart.',
    voice: 'Direct and practical. Gets to the point. Shares tips and real prices. Occasional grammar quirks (natural, not mocking). Uses "actually" a lot. Real talk, no fluff.',
  },
  priya_in: {
    name: 'Priya',
    background: 'Indian UX designer, works remotely. Does yoga in Itaewon park. Navigating the Korean dating scene as a foreigner. Very observational. Has a blog she sometimes references vaguely.',
    voice: 'Reflective and storytelling. Detailed observations. Occasionally philosophical. Uses "honestly", "I feel like", "not gonna lie". Sometimes overthinks things and admits it.',
  },
  marcus_us: {
    name: 'Marcus',
    background: 'Black American English teacher in Busan, music producer on weekends. Navigating being visibly foreign in Korea with humor and honesty. Very real, calls things out but not bitter.',
    voice: 'Real and honest. Good humor. Doesn\'t sugarcoat. Uses AAVE naturally ("fam", "lowkey", "no cap"). Busan-specific references. Warm but direct.',
  },
  wei_cn: {
    name: 'Wei',
    background: 'Chinese PhD student at Yonsei, studying urban economics. Very observational about how Seoul is changing. Gentrification nerd. Travels around Korea on weekends for "field research".',
    voice: 'Analytical but accessible. Academic background shows but doesn\'t lecture. References patterns and data casually. Curious about "why" things work the way they do.',
  },
}

// 카테고리별 주제 풀 (랜덤 선택)
const TOPIC_POOL: Record<string, string[]> = {
  free: [
    // 일상 & 공감
    'a funny or embarrassing cultural misunderstanding you had in Korea',
    'something that genuinely surprised you about Korean culture (positive)',
    'a wholesome random act of kindness you experienced from a stranger in Korea',
    'your honest unfiltered thoughts on Korean apartment living',
    'comparing public transportation in Korea vs your home country',
    'a "only in Korea" moment that happened to you this week',
    'things you took for granted at home that you miss in Korea',
    // 유머 & 가벼운 글
    'a funny story about trying to read Korean menus at a restaurant',
    'the weirdest thing you\'ve seen or experienced in a Korean convenience store',
    'your relationship with 배달 apps - funny story or honest review',
    'a language mix-up or wrong Korean word that caused a hilarious situation',
    'things foreigners always say in Korea that Koreans must find hilarious',
    'comparing Korean internet culture to your home country',
    'the stages of adapting to 빨리빨리 culture - which stage are you?',
    // 진지한 공감
    'making Korean friends - is it actually hard? honest thoughts',
    'how living in Korea changed the way you see your home country',
    'a tough week in Korea - sharing to vent and hear others\' experiences',
    'asking for recommendations: what should every expat in Korea try once?',
  ],
  jobs: [
    'your experience job hunting in Korea as a foreigner - what actually worked',
    'a day in your Korean workplace - the good parts and the confusing parts',
    'navigating Korean work culture as a foreigner (hierarchy, work hours, etc)',
    'freelancing or remote working from Korea - practical tips and experiences',
    'what industries are actually hiring foreigners in Korea right now?',
    'your experience at a Korean company vs a foreign company in Korea',
    'honest advice for foreigners wanting to get an E-7 visa in Korea',
    'a workplace situation that completely confused you as a foreigner',
    'side hustles that work well for expats in Korea',
    'interview tips for Korean companies if you\'re a foreigner',
  ],
  realestate: [
    'your apartment hunting experience as a foreigner - what you learned',
    'asking the community for advice: best neighborhoods for foreigners in Seoul?',
    'a story about dealing with a landlord or agent - good or bad',
    'explaining the 전세 system to someone who just arrived (confused yourself at first)',
    'comparing life in different Seoul neighborhoods after living in a few',
    'tips for negotiating rent when you\'re a foreigner',
    'honest review of living in 고시원 or 오피스텔 vs regular apartment',
    'how to find a foreigner-friendly real estate agent in Korea',
  ],
  marketplace: [
    'selling something before leaving Korea or moving apartments',
    'looking for a specific second-hand item',
    'tips and funny stories from using 당근마켓 as a foreigner',
    'best spots for second-hand shopping in Korea beyond apps',
  ],
  info: [
    'step by step: what I wish I knew before renewing my ARC',
    'opening a Korean bank account as a foreigner - what actually worked in 2026',
    'navigating Korean healthcare as a foreigner - tips from experience',
    'useful apps every foreigner in Korea should have (from experience)',
    'how I sorted out my health insurance as a foreigner in Korea',
    'public transport tips that took me too long to figure out',
  ],
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.93,
        max_tokens: 750,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminSupabase()

  // 가중치 기반 카테고리 선택
  const catSlug = weightedRandomCategory()
  const { data: cat } = await db.from('categories').select('id').eq('slug', catSlug).single()
  if (!cat) {
    return NextResponse.json({ error: `Category ${catSlug} not found` }, { status: 400 })
  }

  // 랜덤 페르소나 선택
  const username = PERSONA_USERNAMES[Math.floor(Math.random() * PERSONA_USERNAMES.length)]
  const { data: profile } = await db.from('profiles').select('id, display_name').eq('username', username).single()
  if (!profile) {
    return NextResponse.json({ error: `Persona ${username} not found. Run /api/seed first.` }, { status: 400 })
  }
  const p = profile as { id: string; display_name: string }
  const persona = PERSONA_DETAILS[username] ?? { name: p.display_name, background: 'foreigner in Korea', voice: 'casual' }

  // 카테고리에서 랜덤 주제 선택
  const topics = TOPIC_POOL[catSlug] ?? TOPIC_POOL.free
  const topic = topics[Math.floor(Math.random() * topics.length)]

  // Community 게시판은 40% 확률로 유머/가벼운 톤
  const isHumor = catSlug === 'free' && Math.random() < 0.4

  const systemPrompt = `You are ${persona.name}, a real foreigner living in Korea posting on an expat community forum.

YOUR BACKGROUND: ${persona.background}
YOUR WRITING VOICE: ${persona.voice}

STRICT RULES — break these and the post will be deleted:
1. Sound like a REAL HUMAN, not an AI. Forbidden phrases: "In conclusion", "It's worth noting", "delve into", "as a foreigner navigating", "tapestry", "bustling".
2. NEVER include personal contact info: no emails, Instagram handles, KakaoTalk IDs, phone numbers, WeChat, Line.
3. NEVER give specific legal, visa, medical, or financial advice as fact. Use "I think", "from my experience", "not sure if this is universal".
4. No hashtags. No "Hope this helps!" endings.
5. Mix in Korean words naturally where they fit (치맥, 편의점, 고시원, 전세, 아파트, 출입국, etc).
6. Vary sentence length — some long, some very short. Include one awkward or self-aware moment.
${isHumor ? '7. Make it genuinely funny and relatable. Reddit-energy. Light roast of yourself or the situation.' : '7. Be genuine and real. Can be funny but doesn\'t have to be.'}

FORMAT: Respond ONLY with valid JSON (no markdown fences):
{"title": "post title (genuine, not clickbait)", "content": "<p>content using p, strong, br tags only</p>"}`

  const userPrompt = `Write a forum post about: ${topic}`

  const raw = await callGroq(systemPrompt, userPrompt)
  if (!raw) {
    return NextResponse.json({ error: 'Groq generation failed. Check GROQ_API_KEY.' }, { status: 500 })
  }

  let generated: { title: string; content: string } | null = null
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) generated = JSON.parse(match[0])
  } catch { /* ignore */ }

  if (!generated?.title || !generated?.content) {
    return NextResponse.json({ error: 'Failed to parse Groq response', raw: raw.slice(0, 200) }, { status: 500 })
  }

  const { data: inserted, error } = await db.from('posts').insert({
    title: generated.title,
    content: generated.content,
    author_id: p.id,
    category_id: (cat as { id: number }).id,
    status: 'published',
    views_count: Math.floor(Math.random() * 12) + 1,
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
      humor_mode: isHumor,
    },
  })
}
