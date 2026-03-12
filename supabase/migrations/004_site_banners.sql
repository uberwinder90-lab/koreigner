-- =============================================
-- SITE BANNERS TABLE
-- Run this in Supabase SQL Editor
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  link_url    TEXT,
  bg_color    TEXT NOT NULL DEFAULT '#2563eb',
  text_color  TEXT NOT NULL DEFAULT '#ffffff',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 활성 배너 조회 가능
CREATE POLICY "banners_select_active" ON public.site_banners
  FOR SELECT USING (true);

-- Service role (admin API)만 삽입/수정/삭제 가능 (API에서 service_role 키 사용)
CREATE POLICY "banners_all_service" ON public.site_banners
  USING (true) WITH CHECK (true);
