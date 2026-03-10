# Koreigner — Community for Foreigners in Korea

A modern community platform built with Next.js 16 + Supabase + Vercel.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, TypeScript, TailwindCSS)
- **Backend/DB**: Supabase (Postgres + Auth + Storage + RLS)
- **Deployment**: Vercel
- **Email**: Resend

## Getting Started

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_init.sql`
3. Go to **Storage** and create 3 public buckets:
   - `avatars`
   - `images`
   - `videos`
4. Set storage policies (allow authenticated uploads to own folder):
   ```sql
   -- For each bucket (avatars, images, videos):
   -- INSERT policy:
   CREATE POLICY "auth_upload" ON storage.objects FOR INSERT 
   WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'images');
   
   -- SELECT policy (public read):
   CREATE POLICY "public_read" ON storage.objects FOR SELECT 
   USING (bucket_id = 'images');
   ```

### 2. Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key

### 3. Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local

# Start dev server
npm run dev
```

### 4. Environment Variables

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Deployment to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Option B: GitHub Integration

1. Push to GitHub
2. Connect repo at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Vercel Region

The `vercel.json` is configured to use `icn1` (Seoul, South Korea) for best performance for Korean users.

## Project Structure

```
koreigner-next/
├── app/
│   ├── (auth)/
│   │   ├── login/          ← Login page
│   │   └── register/       ← Registration (email verification)
│   ├── (main)/
│   │   ├── page.tsx        ← Home (post list, NEW/BEST tabs)
│   │   ├── post/[id]/      ← Post detail
│   │   ├── submit/         ← Write/edit post
│   │   ├── mypage/         ← My profile
│   │   └── profile/[username]/ ← Public profile
│   ├── api/                ← API Routes
│   └── layout.tsx
├── components/
│   ├── layout/             ← Header, Footer, Sidebar
│   ├── post/               ← PostCard
│   └── comment/            ← CommentList
├── lib/
│   └── supabase/           ← Client/Server Supabase clients
├── supabase/
│   └── migrations/         ← SQL schema files
├── types/
│   └── database.ts         ← Type definitions
└── proxy.ts                ← Auth proxy (Next.js 16)
```

## Features

- ✅ Email verification signup
- ✅ Login / Logout
- ✅ Profile management (avatar, display name)
- ✅ Post list (NEW / BEST tabs, category filter, pagination)
- ✅ Post detail (views count, prev/next navigation)
- ✅ Write / Edit / Delete posts
- ✅ Image & video uploads (Supabase Storage)
- ✅ YouTube/Vimeo embed support
- ✅ Like / Unlike posts
- ✅ Report posts
- ✅ Comments (with replies)
- ✅ Public profile page
- ✅ Row Level Security (RLS)
- ✅ Protected routes (proxy)
- ✅ Seoul region deployment (Vercel icn1)
