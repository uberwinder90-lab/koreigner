-- =============================================
-- Koreigner — Initial Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase Auth users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO public.categories (name, slug, description) VALUES
  ('General', 'general', 'General discussions'),
  ('Living in Korea', 'living', 'Tips about living, housing, transport'),
  ('Food & Dining', 'food', 'Korean food, restaurants, cooking'),
  ('Language', 'language', 'Korean language learning'),
  ('Work & Visa', 'work-visa', 'Jobs, visas, legal information'),
  ('Travel', 'travel', 'Trips and travel within Korea'),
  ('Culture', 'culture', 'Korean culture, events, traditions'),
  ('Relationships', 'relationships', 'Dating, friendships, family'),
  ('Q&A', 'qa', 'Questions and answers');

-- =============================================
-- POSTS
-- =============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES public.categories(id),
  views_count INT DEFAULT 0 NOT NULL,
  embedded_url TEXT,
  status TEXT DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'draft', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_category ON public.posts(category_id);
CREATE INDEX idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX idx_posts_status_views ON public.posts(status, views_count DESC);

-- =============================================
-- POST MEDIA
-- =============================================
CREATE TABLE public.post_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  display_order INT DEFAULT 0 NOT NULL
);

CREATE INDEX idx_post_media_post ON public.post_media(post_id);

-- =============================================
-- POST LIKES
-- =============================================
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);

-- =============================================
-- POST REPORTS
-- =============================================
CREATE TABLE public.post_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_comments_post ON public.comments(post_id, status, created_at);

-- =============================================
-- EMAIL VERIFICATIONS
-- =============================================
CREATE TABLE public.email_verifications (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- profiles: 누구나 읽기, 본인만 수정
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- categories: 누구나 읽기
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

-- posts: 누구나 published 읽기, 로그인 유저는 작성, 본인만 수정/삭제
CREATE POLICY "posts_select_published" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "posts_insert_auth" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- post_media: 누구나 읽기, 작성자만 삽입/삭제
CREATE POLICY "post_media_select_all" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "post_media_insert_auth" ON public.post_media FOR INSERT WITH CHECK (
  auth.uid() = (SELECT author_id FROM public.posts WHERE id = post_id)
);
CREATE POLICY "post_media_delete_own" ON public.post_media FOR DELETE USING (
  auth.uid() = (SELECT author_id FROM public.posts WHERE id = post_id)
);

-- post_likes: 누구나 읽기, 로그인 유저만 삽입/삭제
CREATE POLICY "post_likes_select_all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_auth" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- post_reports: 로그인 유저만
CREATE POLICY "post_reports_insert_auth" ON public.post_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- comments: 누구나 published 읽기, 로그인 유저만 작성
CREATE POLICY "comments_select_published" ON public.comments FOR SELECT USING (status = 'published');
CREATE POLICY "comments_insert_auth" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (auth.uid() = author_id);

-- email_verifications: service role만 접근 (API Route에서 service key 사용)
-- 일반 anon / 로그인 유저 접근 차단 (기본 deny)

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Supabase Dashboard > Storage > Create buckets:
--   avatars  (public: true)
--   images   (public: true)
--   videos   (public: true)
--
-- Storage Policies (avatars bucket):
--   INSERT: auth.uid() IS NOT NULL AND name LIKE auth.uid()::text || '/%'
--   SELECT: true (public)
--   DELETE: name LIKE auth.uid()::text || '/%'
--
-- Same pattern for images and videos buckets.

-- =============================================
-- AUTO-PROFILE TRIGGER (optional helper)
-- Creates a profile row automatically when a user signs up
-- Only use if you handle profile creation via trigger
-- =============================================
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, username, display_name)
--   VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), SPLIT_PART(NEW.email, '@', 1));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
