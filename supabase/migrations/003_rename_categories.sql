-- 003_rename_categories.sql
-- Replaces ALL existing categories with the final 5 canonical categories.
-- Uses TRUNCATE CASCADE so any old category references are cleaned up first.
-- ⚠️ Run this in Supabase Dashboard → SQL Editor

-- Step 1: Wipe all existing categories (cascade removes FK references in posts)
TRUNCATE public.categories RESTART IDENTITY CASCADE;

-- Step 2: Insert the 5 canonical categories with final English names
INSERT INTO public.categories (name, slug, description) VALUES
  ('Community',   'free',        'General discussions / 자유로운 이야기'),
  ('Jobs',        'jobs',        'Jobs & Hiring / 일자리 정보'),
  ('House',       'realestate',  'Real Estate / 집·방 정보'),
  ('Marketplace', 'marketplace', 'Buy & Sell / 중고 물건'),
  ('Information', 'info',        'Useful Info / 생활 정보');
