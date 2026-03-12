'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'ko' | 'en'

const T = {
  ko: {
    // Nav
    home: '홈',
    write: '글쓰기',
    login: '로그인',
    signup: '회원가입',
    mypage: '마이페이지',
    logout: '로그아웃',
    writePost: '게시글 쓰기',
    // Categories
    free: 'Community',
    jobs: '구인구직',
    realestate: 'House',
    marketplace: '중고거래',
    info: 'Information',
    allPosts: '전체글',
    // Home
    community: '커뮤니티',
    subtitle: '한국에 사는 외국인들과 소통하세요',
    heroTitle: '대한민국 외국인 커뮤니티 1위',
    heroTitleEn: "Korea's #1 Community for Foreigners",
    heroHint: '비자, 주거, 취업, 생활 정보를 빠르게 찾아보세요',
    searchPlaceholder: '예: 비자 연장, 원룸, 일자리, 은행 계좌',
    search: '검색',
    tabNew: '🕐 최신',
    tabHot: '🔥 인기',
    noPostsTitle: '아직 게시글이 없어요',
    noPostsDesc: '첫 번째 게시글을 작성해 보세요!',
    writeFirst: '첫 게시글 쓰기',
    // Sidebar
    browseTopics: '카테고리',
    trending: '🔥 인기글',
    communityInfo: '커뮤니티',
    communityLine1: '🌍 50개국 외국인 커뮤니티',
    communityLine2: '💬 공유 · 질문 · 소통',
    communityLine3: '🇰🇷 한국 생활을 더 쉽게',
    shareStory: '이야기를 나눠요',
    shareDesc: '한국에 사는 외국인들과 연결하세요',
    quickAccess: 'Quick Access',
    quickVisa: 'Visa',
    quickHousing: 'House',
    quickJobs: 'Jobs',
    quickCommunity: 'Community',
    quickMarketplace: 'Marketplace',
    quickInfo: 'Information',
    // Post
    views: '조회',
    like: '좋아요',
    share: '공유',
    edit: '수정',
    delete: '삭제',
    report: '신고',
    comments: '댓글',
    likes: '좋아요',
    addComment: '댓글 작성',
    commentPlaceholder: '댓글을 작성하세요… (Markdown 지원)',
    prev: '이전글',
    next: '다음글',
    // Submit
    createPost: '게시글 작성',
    editPost: '게시글 수정',
    chooseCommunity: '게시판 선택…',
    postTo: '게시판',
    titleLabel: '제목',
    titleHint: '구체적이고 명확하게',
    cancel: '취소',
    post: '게시',
    saveChanges: '수정 완료',
    posting: '게시 중…',
    uploading: '업로드 중…',
    // Misc
    postedBy: '작성자',
  },
  en: {
    home: 'Home',
    write: 'Write',
    login: 'Log In',
    signup: 'Sign Up',
    mypage: 'My Page',
    logout: 'Log Out',
    writePost: 'Write Post',
    free: 'Community',
    jobs: 'Jobs',
    realestate: 'House',
    marketplace: 'Marketplace',
    info: 'Information',
    allPosts: 'All Posts',
    community: 'Community',
    subtitle: 'Foreigners sharing life in Korea',
    heroTitle: "Korea's #1 Community for Foreigners",
    heroTitleEn: "Korea's #1 Community for Foreigners",
    heroHint: 'Find visa, housing, jobs, and daily-life answers fast.',
    searchPlaceholder: 'e.g. visa extension, one-room, jobs, bank account',
    search: 'Search',
    tabNew: '🕐 New',
    tabHot: '🔥 Hot',
    noPostsTitle: 'No posts yet',
    noPostsDesc: 'Be the first to share something!',
    writeFirst: 'Write First Post',
    browseTopics: 'Categories',
    trending: '🔥 Trending',
    communityInfo: 'Community',
    communityLine1: '🌍 Foreigners from 50+ countries',
    communityLine2: '💬 Share · Ask · Connect',
    communityLine3: '🇰🇷 Life in Korea made easier',
    shareStory: 'Share your story',
    shareDesc: 'Connect with foreigners in Korea',
    quickAccess: 'Quick Access',
    quickVisa: 'Visa',
    quickHousing: 'House',
    quickJobs: 'Jobs',
    quickCommunity: 'Community',
    quickMarketplace: 'Marketplace',
    quickInfo: 'Information',
    views: 'views',
    like: 'Like',
    share: 'Share',
    edit: 'Edit',
    delete: 'Delete',
    report: 'Report',
    comments: 'Comments',
    likes: 'Likes',
    addComment: 'Add Comment',
    commentPlaceholder: 'Write a comment… (Markdown supported)',
    prev: 'Previous',
    next: 'Next',
    createPost: 'Create Post',
    editPost: 'Edit Post',
    chooseCommunity: 'Choose a community…',
    postTo: 'Post to',
    titleLabel: 'Title',
    titleHint: 'Be specific and clear',
    cancel: 'Cancel',
    post: 'Post',
    saveChanges: 'Save Changes',
    posting: 'Posting…',
    uploading: 'Uploading…',
    postedBy: 'Posted by',
  },
} as const

export type TKey = keyof typeof T.ko
export type Translations = typeof T.ko

interface LangCtx { lang: Lang; t: Translations; setLang: (l: Lang) => void }
const LangContext = createContext<LangCtx>({ lang: 'ko', t: T.ko, setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko')
  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'en' || saved === 'ko') setLangState(saved)
  }, [])
  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }
  return (
    <LangContext.Provider value={{ lang, t: T[lang] as Translations, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() { return useContext(LangContext) }
export const CATEGORIES = [
  { slug: 'free',        icon: '💬' },
  { slug: 'jobs',        icon: '💼' },
  { slug: 'realestate',  icon: '🏠' },
  { slug: 'marketplace', icon: '🛒' },
  { slug: 'info',        icon: '📌' },
] as const
