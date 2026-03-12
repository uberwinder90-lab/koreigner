-- =============================================
-- SITE BANNERS POPUP EXTENSION
-- Adds popup flag to existing site_banners table
-- =============================================
ALTER TABLE public.site_banners
  ADD COLUMN IF NOT EXISTS is_popup BOOLEAN NOT NULL DEFAULT false;

