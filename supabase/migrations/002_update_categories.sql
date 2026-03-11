-- =============================================
-- Update categories to 5 core boards
-- Run this in the Supabase SQL Editor
-- =============================================

TRUNCATE public.categories RESTART IDENTITY CASCADE;

INSERT INTO public.categories (name, slug, description) VALUES
  ('자유게시판', 'free',        'General discussions / 자유로운 이야기'),
  ('구인구직',   'jobs',        'Jobs & Hiring / 일자리 정보'),
  ('부동산',     'realestate',  'Real Estate / 집·방 정보'),
  ('중고거래',   'marketplace', 'Buy & Sell / 중고 물건'),
  ('정보',       'info',        'Useful Info / 생활 정보');
