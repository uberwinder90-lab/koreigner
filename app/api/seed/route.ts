import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

// ─── Protect with secret key ───
function checkSecret(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret')
  return secret === process.env.SEED_SECRET
}

// ─── Persona definitions ───
const PERSONAS = [
  // 기존 8명
  { email: 'jake.miller.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'jake_usa', display_name: 'Jake Miller', nationality: 'American', bio: 'Software engineer from Austin, TX. Living in Gangnam since 2022.' },
  { email: 'sophie.martin.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'sophie_fr', display_name: 'Sophie Martin', nationality: 'French', bio: 'French teacher at Hongik University. Loves Korean street food.' },
  { email: 'alex.chen.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'alex_hk', display_name: 'Alex Chen', nationality: 'British', bio: 'Financial analyst. Moved from London to Seoul for work.' },
  { email: 'yuki.tanaka.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'yuki_jp', display_name: 'Yuki Tanaka', nationality: 'Japanese', bio: 'Game designer. K-drama fan since forever. Now lives it!' },
  { email: 'nguyen.linh.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'linh_vn', display_name: 'Linh Nguyen', nationality: 'Vietnamese', bio: 'Running a small food business in Itaewon. Korean food is life.' },
  { email: 'priya.sharma.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'priya_in', display_name: 'Priya Sharma', nationality: 'Indian', bio: 'UX designer, remote worker. Yoga + kimchi = perfect life.' },
  { email: 'marcus.johnson.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'marcus_us', display_name: 'Marcus Johnson', nationality: 'American', bio: 'English teacher in Busan. K-hip hop enthusiast.' },
  { email: 'chen.wei.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'wei_cn', display_name: 'Wei Chen', nationality: 'Chinese', bio: 'PhD student at Yonsei. Researching urban economics.' },
  // 인터넷 닉네임 스타일 + 추가 실명 스타일 페르소나
  { email: 'seoul.ramyeon.lord@seed.koreigner.com', password: 'SeedPass!2026', username: 'ramyeon_lord', display_name: 'ramyeon_lord', nationality: 'Australian', bio: 'Moved from Melbourne. On a personal mission to eat every instant noodle brand in Korea. Convenience store devotee.' },
  { email: 'seoulbound.forever@seed.koreigner.com', password: 'SeedPass!2026', username: 'SeoulBound99', display_name: 'SeoulBound99', nationality: 'Canadian', bio: 'Overstayed my "just 1 year" plan by 3 years. Marketing manager. Permanently confused by Korean bureaucracy.' },
  { email: 'k.life.unplugged@seed.koreigner.com', password: 'SeedPass!2026', username: 'k_life_unplugged', display_name: 'k_life_unplugged', nationality: 'German', bio: 'Engineer turned ESL teacher. Documenting the chaos of expat life in Korea, unfiltered.' },
  { email: 'itaewon.diaries.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'itaewon_diaries', display_name: 'itaewon_diaries', nationality: 'Brazilian', bio: 'Brazilian in Seoul. Fashion, food, and finding good coffee. Itaewon local.' },
  { email: 'tom.wilson.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'tom_wilson', display_name: 'Tom Wilson', nationality: 'American', bio: 'Marketing at a Korean company. Chicago guy. 2 years in Mapo. Still figuring it all out.' },
  { email: 'emma.blackwood.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'emma_au', display_name: 'Emma Blackwood', nationality: 'Australian', bio: 'Copywriter, working remote. Came for a year, stayed for three. Based in Yeonnam-dong.' },
  { email: 'dmitri.volkov.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'dmitri_ru', display_name: 'Dmitri Volkov', nationality: 'Russian', bio: 'Data scientist at a fintech startup. Moved from Moscow. Quietly fascinated by everything.' },
  { email: 'sara.kim.kr@seed.koreigner.com', password: 'SeedPass!2026', username: 'sara_kA', display_name: 'Sara Kim', nationality: 'Korean-American', bio: 'Korean-American navigating the in-between. Too American for Korea, too Korean for America.' },
  { email: 'noodles.in.seoul@seed.koreigner.com', password: 'SeedPass!2026', username: 'noodles_in_seoul', display_name: 'noodles_in_seoul', nationality: 'American', bio: 'Came for a food tour. Got a job. Stayed. Food content creator and reluctant expat.' },
  { email: 'expat.in.progress@seed.koreigner.com', password: 'SeedPass!2026', username: 'expat_in_progress', display_name: 'expat_in_progress', nationality: 'South African', bio: 'Still figuring Korea out one mistake at a time. Based in Sinchon.' },
  { email: 'hongdae.hannah@seed.koreigner.com', password: 'SeedPass!2026', username: 'hongdae_hannah', display_name: 'hongdae_hannah', nationality: 'British', bio: 'Illustrator from London. Moved for the art scene, stayed for the cheap coffee and great transit.' },
  { email: 'korea.by.accident@seed.koreigner.com', password: 'SeedPass!2026', username: 'korea_by_accident', display_name: 'korea_by_accident', nationality: 'New Zealander', bio: 'Came for 3 months. Married a Korean. Stayed forever. Now very domestic.' },
]

// ─── Seed posts (30 total, 6 per category) ───
// category slugs: free, jobs, realestate, marketplace, info
const SEED_POSTS = [
  // ── 자유게시판 (free) ──
  {
    title: 'First year in Korea — what surprised me the most',
    content: '<p>I just hit my one-year anniversary living in Seoul and I have to say, the thing that surprised me most isn\'t the food or the language barrier — it\'s how <strong>safe</strong> everything feels. I leave my laptop at a coffee shop table to grab a refill and nobody touches it. Back home in Austin that would be gone in 30 seconds.</p><p>What surprised you most in your first year?</p>',
    category: 'free', author_idx: 0,
  },
  {
    title: '한국에서의 문화 충격 — 좋은 것들',
    content: '<p>프랑스에서 온 제게 한국은 정말 많은 면에서 놀라웠어요. 특히 밤 12시에도 편의점이 환하게 켜져 있고, 배달이 30분 안에 온다는 게 믿기지 않았어요.</p><p>여러분이 경험한 긍정적인 문화 충격은 뭔가요?</p>',
    category: 'free', author_idx: 1,
  },
  {
    title: 'Best apps for living in Korea as a foreigner',
    content: '<p>After 2 years here I\'ve compiled my essential app list:</p><p><strong>Kakao Map</strong> — infinitely better than Google Maps in Korea<br/><strong>Naver Papago</strong> — translation is excellent<br/><strong>Coupang</strong> — Amazon equivalent, delivery is insane<br/><strong>Toss</strong> — best banking app, supports foreigners<br/><strong>KakaoTalk</strong> — literally everyone uses this</p><p>Anything I\'m missing?</p>',
    category: 'free', author_idx: 2,
  },
  {
    title: '한국 친구 사귀는 방법 — 솔직한 이야기',
    content: '<p>많은 외국인들이 한국에서 진짜 친한 한국인 친구를 사귀기 힘들다고 해요. 저도 처음에 그랬는데, 방법을 찾았어요.</p><p>제가 효과 봤던 것들: 동아리 활동, 언어교환 앱 (HelloTalk, Tandem), 직장 동료와의 회식 적극 참여. 특히 <strong>언어교환</strong>이 가장 자연스럽게 친구를 만든 방법이었어요.</p>',
    category: 'free', author_idx: 3,
  },
  {
    title: 'Busan vs Seoul — where to live as a foreigner?',
    content: '<p>I\'ve been in Busan for 8 months now and people always ask why I didn\'t pick Seoul. Here\'s my honest comparison:</p><p><strong>Busan pros:</strong> beach 20 min away, cheaper rent by 30-40%, less crowded, friendlier locals (IMO), incredible seafood</p><p><strong>Seoul pros:</strong> more expat community, better job opportunities, more international restaurants, better transport network</p><p>If you work remotely like me, Busan is a no-brainer. But for career growth, Seoul wins.</p>',
    category: 'free', author_idx: 6,
  },
  {
    title: '솔직히 한국 생활에서 힘든 점들',
    content: '<p>좋은 것만 이야기하면 거짓말이니까 솔직하게 써볼게요. 2년째 서울에 살면서 힘든 점들:</p><p>1. <strong>관료주의</strong> — 외국인으로서 서류 작업이 정말 복잡해요<br/>2. 언어 장벽 — 아직도 전화 통화가 두렵다<br/>3. 혼자 식사하기 — 눈치가 좀 보임<br/>4. 연중무휴 일하는 문화 — 퇴근 후 카톡이 계속 옴</p><p>그래도 여기가 좋은 이유가 더 많아서 살고 있어요 😊</p>',
    category: 'free', author_idx: 5,
  },

  // ── 구인구직 (jobs) ──
  {
    title: '[Hiring] English/Korean bilingual customer support — remote OK',
    content: '<p>Our fintech startup is looking for a bilingual customer support specialist. You\'ll handle inquiries from both Korean and international users.</p><p><strong>Requirements:</strong><br/>• Native or near-native English + conversational Korean (TOPIK 3+ preferred)<br/>• 1+ years customer support experience<br/>• Located in Korea (remote work 3 days/week)</p><p><strong>Pay:</strong> ₩2,800,000 – ₩3,500,000/month depending on experience<br/><strong>Apply:</strong> DM me or email jobs@[company].com</p>',
    category: 'jobs', author_idx: 2,
  },
  {
    title: 'Freelance translator needed — English to Korean (tech docs)',
    content: '<p>Looking for a freelance translator for technical documentation. We\'re a SaaS company expanding into Korea and need our product docs translated.</p><p>Volume: ~20,000 words initially, ongoing work possible<br/>Rate: Negotiable, ₩70-100 per source word<br/>Deadline: Flexible, within 3 weeks ideal</p><p>Please share samples of previous technical translation work.</p>',
    category: 'jobs', author_idx: 0,
  },
  {
    title: '영어 과외 구해요 — 강남/서초 or 온라인',
    content: '<p>안녕하세요! IELTS 준비하는 직장인인데 원어민 튜터를 구하고 있어요.</p><p>조건: 주 2회, 1시간씩 / 시간당 4-5만원 / 강남역 or 온라인 모두 가능<br/>목표 점수: 7.5 이상<br/>시작: 4월 첫째 주부터</p><p>경험 있는 분 댓글 달아주세요!</p>',
    category: 'jobs', author_idx: 7,
  },
  {
    title: 'My experience getting a job in Korea as a foreigner (E-7 visa)',
    content: '<p>I\'ve seen a lot of questions about working in Korea on non-teaching visas so I wanted to share my experience getting an E-7 (Specific Activities) visa as a UX designer.</p><p>The key things that helped me: <strong>portfolio in Korean + English</strong>, networking on LinkedIn with Korean recruiters, and being flexible on salary expectations initially. The E-7 process took about 3 months total from offer to visa approval.</p><p>Happy to answer questions about the process!</p>',
    category: 'jobs', author_idx: 5,
  },
  {
    title: '[구직] 일본어-한국어 동시통역사 / 번역 구직 중',
    content: '<p>안녕하세요, 일본에서 온 Yuki입니다. 현재 프리랜서 통번역 기회를 찾고 있어요.</p><p>보유 스킬: 일한 동시통역 (경력 3년), 문서 번역, 비즈니스 회의 통역<br/>분야: 게임, 엔터테인먼트, IT<br/>가능 지역: 서울 전 지역, 원격 가능</p><p>연락처: 댓글이나 쪽지 주세요!</p>',
    category: 'jobs', author_idx: 3,
  },
  {
    title: 'Which job platforms actually work for foreigners in Korea?',
    content: '<p>After trying basically everything, here\'s my honest ranking:</p><p><strong>1. LinkedIn</strong> — still best for international/foreign-friendly companies<br/><strong>2. Wanted (원티드)</strong> — great for tech/startup roles, supports English<br/><strong>3. Saramin (사람인)</strong> — biggest Korean job board but mostly Korean<br/><strong>4. WorknPlay</strong> — specifically for foreign workers in Korea<br/><strong>5. Dave\'s ESL Café</strong> — only if you\'re looking for teaching gigs</p>',
    category: 'jobs', author_idx: 0,
  },

  // ── 부동산 (realestate) ──
  {
    title: '강남 원룸 구한 후기 — 외국인 세입자 현실',
    content: '<p>3개월 방 구하기 끝에 드디어 강남구에 원룸을 잡았어요. 외국인이라 거절 많이 당했는데 결국 성공한 방법을 공유해요.</p><p>핵심: <strong>보증금을 조금 더 올려서 제안하기</strong> + 외국인 친화 부동산 앱 활용(직방이 가장 좋았어요) + 한국인 친구나 동료에게 동행 부탁하기</p><p>월세 75만원, 보증금 500만원으로 계약했어요. 지역은 도곡동입니다.</p>',
    category: 'realestate', author_idx: 1,
  },
  {
    title: 'Jeonse vs Wolse — what I learned after 2 years',
    content: '<p>Everyone asks about jeonse (전세) vs wolse (월세) so here\'s the breakdown after living both:</p><p><strong>Jeonse:</strong> You pay a large lump sum (30-80% of property value) and live rent-free. You get it all back when you leave. Requires a LOT of upfront cash but saves money long-term.</p><p><strong>Wolse:</strong> Monthly rent + smaller deposit. More flexible, better for shorter stays or if you don\'t have the capital for jeonse.</p><p>As a foreigner, wolse is usually more accessible since jeonse requires significant Korean financial history and bank relationships.</p>',
    category: 'realestate', author_idx: 2,
  },
  {
    title: 'Itaewon 원룸 단기 렌트 후기 (2개월)',
    content: '<p>짧게 한국에 머무는 분들을 위해 단기 렌트 후기 남겨요. 이태원에서 에어비앤비 대신 일반 원룸 단기 계약(2개월)으로 구했는데 훨씬 저렴했어요.</p><p>어떻게 찾았냐면: 직방에서 "단기임대" 필터로 검색 + 부동산 중개소 직접 방문. 보증금 100만원에 월 75만원이었어요. 이태원 중심부에서 도보 5분 거리.</p>',
    category: 'realestate', author_idx: 3,
  },
  {
    title: 'Hongdae area apartment guide for foreigners',
    content: '<p>Hongdae is one of the best areas for young expats. Here\'s what you need to know about finding a place:</p><p><strong>Budget ranges (per month):</strong><br/>원룸 (studio): ₩550k–₩850k<br/>오피스텔: ₩700k–₩1.2M<br/>1-bed apartment: ₩900k–₩1.5M</p><p>Most landlords are foreigner-friendly in this area given the large international student population at Hongik University. Recommend using Zigbang (직방) and having your foreign registration card ready before negotiating.</p>',
    category: 'realestate', author_idx: 4,
  },
  {
    title: '외국인 등록증 없이 월세 계약 가능한가요?',
    content: '<p>한국에 온 지 2주 됐는데 아직 외국인 등록증이 없어요. 임시로 숙소를 구해야 하는데 등록증 없이 계약이 가능한지 궁금해서요.</p><p>경험 있는 분 계시면 알려주세요 🙏</p>',
    category: 'realestate', author_idx: 7,
  },
  {
    title: 'Tips for negotiating rent as a foreigner in Seoul',
    content: '<p>After renting 4 different apartments in Seoul, here are negotiation tips that actually worked:</p><p>1. <strong>Offer slightly higher deposit in exchange for lower monthly rent</strong> — landlords prefer security<br/>2. Sign a longer contract (2 years vs 1) for a discount<br/>3. Move in during off-peak seasons (summer/winter) when demand is lower<br/>4. Always inspect for mold, especially in basements/semi-basements<br/>5. Get everything in writing — verbally agreed things disappear fast</p>',
    category: 'realestate', author_idx: 5,
  },

  // ── 중고거래 (marketplace) ──
  {
    title: '[판매] IKEA 책상 + 의자 세트 — 강남 직거래',
    content: '<p>귀국하게 되어 IKEA ALEX 책상과 MARKUS 의자 팔아요.</p><p>책상: 가로 132cm, 서랍 달린 것. 흠집 거의 없음<br/>의자: 허리 지지대 있음, 약간 사용감<br/><strong>가격: 세트 15만원 (원래 35만원에 구입)</strong><br/>직거래: 강남역 10번 출구 근처<br/>연락: 댓글 주세요</p>',
    category: 'marketplace', author_idx: 1,
  },
  {
    title: 'Selling my bicycle — Gangnam area',
    content: '<p>Selling my Specialized Sirrus commuter bicycle. Moving back to the UK next month so need to let it go.</p><p>Year: 2022, ridden ~2,000km<br/>Size: Medium (fits 175-185cm)<br/>Condition: Good, minor scratches<br/><strong>Price: ₩280,000</strong> (paid ₩680,000 new)<br/>Meet: Yangjae or Gangnam station area</p><p>Also comes with helmet, lock, and lights.</p>',
    category: 'marketplace', author_idx: 2,
  },
  {
    title: '[구매] 아이패드 프로 11인치 (2022 이상) 구해요',
    content: '<p>아이패드 프로 11인치 2022년형 이상 구해요. 상태 좋은 중고 찾습니다.</p><p>예산: 60-80만원<br/>조건: 배터리 80% 이상, 기스 없으면 좋겠음<br/>연락: 댓글 남겨주세요</p>',
    category: 'marketplace', author_idx: 3,
  },
  {
    title: 'Best apps for buying/selling second-hand in Korea?',
    content: '<p>For newcomers — here are the main second-hand apps in Korea:</p><p><strong>당근마켓 (Daangn)</strong> — Korea\'s equivalent of Facebook Marketplace. Hyperlocal, most popular<br/><strong>번개장터 (Bungae)</strong> — Better for electronics and branded items<br/><strong>중고나라 (Joonggonara)</strong> — Older platform but huge inventory</p><p>All three have apps. Daangn is the easiest to use without Korean skills because it\'s mostly picture-based.</p>',
    category: 'marketplace', author_idx: 0,
  },
  {
    title: '[판매] 요가 매트 + 폼롤러 + 밴드 세트',
    content: '<p>헬스 기구 정리합니다. 모두 깨끗하게 사용했어요.</p><p>롤루레몬 5mm 요가 매트: 5만원<br/>폼롤러 (30cm): 1만5천원<br/>저항 밴드 5개 세트: 1만원<br/><strong>전체 묶음 6만원에 드려요!</strong><br/>직거래: 서초구, 이태원 가능</p>',
    category: 'marketplace', author_idx: 5,
  },
  {
    title: 'Selling kitchen items before leaving Korea',
    content: '<p>Heading back to Vietnam next week — selling everything in my apartment. All items barely used:</p><p>Rice cooker (Cuckoo 10-cup): ₩45,000<br/>Air fryer (Philips, 4L): ₩55,000<br/>Coffee machine (Nespresso): ₩60,000<br/>Full set of IKEA plates/bowls: ₩20,000</p><p>Prefer to sell as bundle for ₩160,000 (normally ₩300,000+ total). Itaewon area pickup only.</p>',
    category: 'marketplace', author_idx: 4,
  },

  // ── 정보 (info) ──
  {
    title: 'Complete guide: Renewing your ARC (외국인등록증) in 2026',
    content: '<p>I just renewed my ARC and the process has changed a bit, so here\'s the updated guide:</p><p><strong>Where:</strong> Any immigration office (출입국관리사무소) or HiKorea online<br/><strong>When:</strong> You can renew up to 3 months before expiry<br/><strong>What to bring:</strong><br/>• Current ARC<br/>• Passport<br/>• 1 passport photo<br/>• Applicable fee (₩30,000 for most)<br/>• Employment contract or enrollment certificate (depending on visa type)</p><p>Online renewal via HiKorea is now available for most visa types and takes 5-7 business days. Much faster than in-person!</p>',
    category: 'info', author_idx: 0,
  },
  {
    title: '외국인 은행 계좌 개설 방법 (2026 최신)',
    content: '<p>ARC 받고 나서 은행 계좌 개설이 제일 먼저 할 일이죠. 제가 시도해본 은행들 정리해 드릴게요.</p><p><strong>카카오뱅크:</strong> 앱으로 비대면 개설 가능. 외국인 등록증만 있으면 OK. 가장 쉬움!<br/><strong>토스뱅크:</strong> 마찬가지로 앱으로 가능. 환율 우대 혜택 좋음<br/><strong>신한은행:</strong> 영어 서비스 지점 있음 (이태원, 강남 등). 신용카드 연결 쉬움<br/><strong>기업은행 (IBK):</strong> 외국인 근로자 특화 서비스. 직원 도움 받기 용이</p>',
    category: 'info', author_idx: 1,
  },
  {
    title: 'How to get Korean health insurance (건강보험) as a foreigner',
    content: '<p>Korean healthcare is excellent and affordable — but navigating the insurance system as a foreigner can be confusing. Here\'s the breakdown:</p><p><strong>If you\'re employed:</strong> Your company enrolls you automatically. ~3.5% of salary deducted monthly.</p><p><strong>If self-employed/freelance/student:</strong> You need to enroll at your local Community Health Center (주민센터) or online at nhis.or.kr. Monthly premium is income-based, minimum ~₩90,000/month for foreigners.</p><p><strong>After 6 months ARC:</strong> Enrollment becomes mandatory. Before that it\'s optional.</p>',
    category: 'info', author_idx: 2,
  },
  {
    title: '한국 국제운전면허증 교환 방법 — 국가별 정리',
    content: '<p>많은 분들이 모국 운전면허를 한국 면허로 교환할 수 있다는 걸 모르세요. 양자 협약 국가 출신이면 필기시험 없이 교환 가능해요!</p><p>교환 가능 국가: 미국, 캐나다, 영국, 독일, 프랑스, 일본, 호주 등 30개국 이상<br/>절차: 가까운 운전면허시험장 방문 → 서류 제출 → 신체검사 → 발급 (약 1시간)<br/>필요 서류: 여권, ARC, 원국 면허증, 면허 번역본(공증 필요한 경우 있음)</p>',
    category: 'info', author_idx: 7,
  },
  {
    title: 'Surviving Korean winters — practical tips for expats',
    content: '<p>Korean winters are colder than most expats expect. Here\'s what I\'ve learned after 3 winters in Seoul:</p><p><strong>Heating:</strong> Most apartments use ondol (floor heating) — it\'s amazing. Don\'t sleep with it on full blast all night or you\'ll wake up dehydrated.<br/><strong>Clothing:</strong> Wind is the killer here. A good windproof jacket matters more than a thick coat.<br/><strong>Air quality:</strong> January–March can have bad yellow dust (황사) from China. Get an air purifier and quality mask (KF94).<br/><strong>Skin:</strong> Korean winters are extremely dry. Invest in a good humidifier and moisturizer.</p>',
    category: 'info', author_idx: 6,
  },
  {
    title: '한국 생활 필수 정보 모음 — 입국 직후 해야 할 것들',
    content: '<p>한국 도착 후 2주 안에 해야 할 일들 체크리스트:</p><p>✅ <strong>외국인 등록증 신청</strong> — 입국 후 90일 이내 필수 (취업/유학 비자)<br/>✅ <strong>주민센터 전입신고</strong> — 거주지 등록<br/>✅ <strong>은행 계좌 개설</strong> — 카카오뱅크 앱으로 가장 쉬움<br/>✅ <strong>핸드폰 개통</strong> — 알뜰폰(MVNO) 추천 (월 2-3만원대)<br/>✅ <strong>건강보험 확인</strong> — 직장가입자는 자동, 지역가입자는 신청 필요<br/>✅ <strong>카카오톡 설치</strong> — 이게 없으면 한국 생활 안 됩니다 😅</p>',
    category: 'info', author_idx: 5,
  },
]

// ─── Seed comments ───
const SEED_COMMENTS = [
  // Post 0 (first year surprises)
  { post_idx: 0, author_idx: 1, content: 'Totally agree about the safety thing! I left my bag on a seat at a café for 20 minutes while exploring and it was still there. Unimaginable in Paris.' },
  { post_idx: 0, author_idx: 3, content: 'For me it was the speed of everything. Need a document? Done in 5 minutes. Delivery? 30 minutes. Internet? Blazing fast everywhere. Korea runs at a different pace.' },
  { post_idx: 0, author_idx: 6, content: 'The thing that got me was how late everything is open. Subway until midnight, convenience stores 24/7, restaurants often until 2-3am. Great for a night owl like me.' },
  // Post 1 (문화 충격)
  { post_idx: 1, author_idx: 0, content: 'Completely agree! I was also amazed by how young people are so willing to help foreigners even with the language barrier. People will pull out Google Translate and spend 10 minutes helping you find the right bus.' },
  { post_idx: 1, author_idx: 6, content: '저도 비슷해요. 처음엔 빨리빨리 문화가 좀 부담스러웠는데, 이제는 다시 미국 가면 느린 서비스에 답답할 것 같아요 😂' },
  // Post 2 (best apps)
  { post_idx: 2, author_idx: 4, content: 'Would add 네이버 스마트스토어 and 쿠팡이츠 for food delivery! Also Kakaopay/Toss for contactless payments — most places accept these now.' },
  { post_idx: 2, author_idx: 5, content: 'For navigation, T-map is what most Korean drivers use, better than Kakao Map for driving routes. Also Subway Korea app is great for metro navigation.' },
  { post_idx: 2, author_idx: 7, content: 'Pleco for Chinese → Korean dictionary lookup is also super helpful if you can read characters, since a lot of Korean vocab has Chinese roots.' },
  // Post 3 (한국 친구 사귀기)
  { post_idx: 3, author_idx: 0, content: 'Meetup.com also has tons of expat/language exchange events in Seoul. Found my best Korean friends through a hiking club there!' },
  { post_idx: 3, author_idx: 2, content: 'The key is consistency. Going to the same place regularly — same gym, same café, same language exchange — people start recognizing you and conversations happen naturally.' },
  // Post 4 (Busan vs Seoul)
  { post_idx: 4, author_idx: 1, content: 'Busan sounds so tempting. Does it have a decent expat community? I worry about feeling isolated without a big international network.' },
  { post_idx: 4, author_idx: 7, content: 'I visit Busan every summer and seriously consider moving. The Haeundae area has a surprisingly international vibe. Many digital nomads there now.' },
  { post_idx: 4, author_idx: 6, content: 'Can confirm — been in Busan 8 months. The expat community is smaller but tighter. You actually get to know everyone. In Seoul you can be anonymous which some like, but I prefer the community feel here.' },
  // Post 5 (힘든 점들)
  { post_idx: 5, author_idx: 0, content: 'The phone call anxiety is SO real. I literally rehearse what I need to say before calling anywhere. Having Korean friends who can make calls for you is a lifesaver.' },
  { post_idx: 5, author_idx: 3, content: '공감해요. 저도 전화하는 게 아직도 두렵고... 특히 병원 예약할 때요. 네이버/카카오 예약으로 할 수 있는 곳은 무조건 온라인으로 해요.' },
  // Post 6 (job hiring)
  { post_idx: 6, author_idx: 0, content: 'Is TOPIK 3 mandatory or just preferred? I have Business English certification and about 2 years of customer success experience.' },
  { post_idx: 6, author_idx: 5, content: 'What timezone are the working hours? Asking for those of us who are used to remote work across time zones.' },
  // Post 7 (translator needed)
  { post_idx: 7, author_idx: 3, content: 'I might be interested! I\'m a technical translator (JP-KR-EN) with experience in gaming and software. Do you need strictly EN-KR or can the process be EN-KR via Japanese?' },
  { post_idx: 7, author_idx: 5, content: 'Happy to take this on — I have EN-KR experience in SaaS documentation. Will DM you with samples.' },
  // Post 8 (영어 과외)
  { post_idx: 8, author_idx: 0, content: 'I\'d be interested! Native English speaker (Texas), former IELTS 8.5 scorer, currently teaching at a language institute in Gangnam. Can do Wednesday evenings or Saturday morning.' },
  { post_idx: 8, author_idx: 6, content: 'I can help too — IELTS examiner certified, available online. DM me your schedule!' },
  // Post 9 (E-7 visa experience)
  { post_idx: 9, author_idx: 0, content: 'Super helpful! Quick question — did your employer sponsor the visa application or did you have to handle it mostly yourself?' },
  { post_idx: 9, author_idx: 7, content: '정말 도움이 됐어요! 저도 E-7 비자 신청 중인데 질문 드려도 될까요? 특히 포트폴리오 번역 부분이 궁금해요.' },
  // Post 14 (강남 원룸 후기)
  { post_idx: 14, author_idx: 0, content: 'Thanks for sharing! Did you use a real estate agent (공인중개사) or did you find it directly? And was there an agency fee?' },
  { post_idx: 14, author_idx: 2, content: 'The 외국인 친화 중개사 tip is gold. I searched "expat friendly realtor Seoul" and found agents who specialize in helping foreigners. Worth the slightly higher agency fee for the stress saved.' },
  // Post 15 (jeonse vs wolse)
  { post_idx: 15, author_idx: 0, content: 'Great breakdown! One thing to add about jeonse — the deposit protection has improved but there have been jeonse fraud cases. Using HUG (주택도시보증공사) insurance is highly recommended.' },
  { post_idx: 15, author_idx: 4, content: 'What about monthly cost comparison? If jeonse deposit is ₩200M and wolse is ₩500k/month + ₩5M deposit — how do I calculate which is better?' },
  // Post 19 (best second-hand apps)
  { post_idx: 19, author_idx: 3, content: '당근마켓 is incredible. Just sold a bookshelf within 2 hours of listing it. The hyperlocal feature means the buyer can literally walk to you.' },
  { post_idx: 19, author_idx: 1, content: 'Does Daangn work in English? Or do you need Korean to use it effectively?' },
  { post_idx: 19, author_idx: 0, content: 'Daangn has English language support now, though not everything is translated. But the app is visual enough that you can get by. The key is setting your neighborhood correctly when you register.' },
  // Post 21 (ARC renewal guide)
  { post_idx: 21, author_idx: 1, content: 'Thank you!! Just bookmarked this. My ARC expires in 2 months and I was dreading the process. Didn\'t know online was an option now.' },
  { post_idx: 21, author_idx: 3, content: 'One addition: if you\'re renewing in Seoul, Nowon and Yangcheon offices tend to be less busy than the main Seoul office. Worth the extra commute.' },
  { post_idx: 21, author_idx: 7, content: '히코리아 온라인 신청이 생각보다 쉬웠어요. 영어 지원도 되고 서류 업로드도 간단해요. 강추합니다.' },
  // Post 22 (은행 계좌)
  { post_idx: 22, author_idx: 0, content: 'Kakao Bank is genuinely the easiest. Opened mine in 20 minutes on my phone. The app is excellent even with limited Korean because of the icons.' },
  { post_idx: 22, author_idx: 2, content: 'For those who need a credit card (신용카드) eventually, I recommend Shinhan Bank — they\'re most willing to give foreigners credit cards after 1 year of banking history.' },
  // Post 24 (운전면허 교환)
  { post_idx: 24, author_idx: 0, content: 'Just did this last month with a Texas license! The whole process took about 90 minutes total at the Seoul Dobong license test center. Much easier than I expected.' },
  { post_idx: 24, author_idx: 2, content: 'Important note: some countries require an IDP (International Driving Permit) alongside the foreign license. Check your country\'s specific requirements before going.' },
  // Post 25 (Korean winters)
  { post_idx: 25, author_idx: 1, content: 'The yellow dust warning is no joke. I got a KF94 mask specifically for that season and my allergies improved dramatically. The Airvisual app is great for checking AQI daily.' },
  { post_idx: 25, author_idx: 5, content: 'Ondol is life-changing. After experiencing it I genuinely can\'t understand why more countries don\'t use floor heating. Especially the heated bathroom floors in some apartments... pure luxury.' },
  // Post 26 (입국 체크리스트)
  { post_idx: 26, author_idx: 0, content: '완전 정확한 리스트예요! 저도 처음에 순서를 몰라서 외등증 없이 은행 가서 거절당했던 기억이... ㅎㅎ 이 리스트 있었으면 좋았을 텐데.' },
  { post_idx: 26, author_idx: 2, content: 'One addition: get a T-money card (교통카드) from any convenience store immediately. Saves money on every transit ride and works on buses, metro, and even some taxis.' },
  { post_idx: 26, author_idx: 6, content: 'For mobile phones — I use KT M-mobile (알뜰폰) and pay ₩19,900/month for unlimited calls + 11GB data. There are tons of MVNO options that are much cheaper than the big three carriers.' },
]

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminSupabase()
  const results: string[] = []
  const profileIds: string[] = []

  // ── Step 1: Create auth users + profiles ──
  for (const persona of PERSONAS) {
    try {
      const { data: existing } = await db.auth.admin.listUsers()
      const found = existing?.users.find(u => u.email === persona.email)

      let userId: string
      if (found) {
        userId = found.id
        results.push(`✓ persona exists: ${persona.username}`)
      } else {
        const { data: created, error } = await db.auth.admin.createUser({
          email: persona.email,
          password: persona.password,
          email_confirm: true,
          user_metadata: { full_name: persona.display_name },
        })
        if (error || !created.user) {
          results.push(`✗ failed to create ${persona.username}: ${error?.message}`)
          profileIds.push('')
          continue
        }
        userId = created.user.id
        results.push(`✓ created auth user: ${persona.username}`)
      }

      profileIds.push(userId)

      // Upsert profile
      await db.from('profiles').upsert({
        id: userId,
        username: persona.username,
        display_name: persona.display_name,
      }, { onConflict: 'id' })
    } catch (e) {
      results.push(`✗ exception for ${persona.username}: ${String(e)}`)
      profileIds.push('')
    }
  }

  // ── Step 2: Get category IDs ──
  const { data: cats } = await db.from('categories').select('id, slug')
  const catMap: Record<string, number> = {}
  for (const c of (cats ?? []) as { id: number; slug: string }[]) {
    catMap[c.slug] = c.id
  }

  // ── Step 3: Insert posts ──
  const postIds: string[] = []
  for (const p of SEED_POSTS) {
    const authorId = profileIds[p.author_idx]
    const catId = catMap[p.category]
    if (!authorId || !catId) {
      results.push(`✗ skipping post "${p.title.slice(0, 30)}…": missing author or category`)
      postIds.push('')
      continue
    }

    // Use different timestamps so posts spread across recent days
    const daysAgo = Math.floor(Math.random() * 14)
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 43200000).toISOString()

    const { data: inserted, error } = await db.from('posts').insert({
      title: p.title,
      content: p.content,
      author_id: authorId,
      category_id: catId,
      status: 'published',
      views_count: Math.floor(Math.random() * 200) + 5,
      created_at: createdAt,
      updated_at: createdAt,
    }).select('id').single()

    if (error || !inserted) {
      results.push(`✗ failed post "${p.title.slice(0, 30)}": ${error?.message}`)
      postIds.push('')
    } else {
      postIds.push((inserted as { id: string }).id)
      results.push(`✓ post: "${p.title.slice(0, 40)}"`)
    }
  }

  // ── Step 4: Insert comments ──
  for (const c of SEED_COMMENTS) {
    const postId = postIds[c.post_idx]
    const authorId = profileIds[c.author_idx]
    if (!postId || !authorId) continue

    const hoursAgo = Math.random() * 48
    const createdAt = new Date(Date.now() - hoursAgo * 3600000).toISOString()

    await db.from('comments').insert({
      post_id: postId,
      author_id: authorId,
      content: c.content,
      parent_id: null,
      status: 'published',
      created_at: createdAt,
    })
  }
  results.push(`✓ comments inserted: ${SEED_COMMENTS.length}`)

  return NextResponse.json({ success: true, log: results })
}
