# Closetify

Your whole wardrobe on one screen. See what you own, get a daily outfit for the weather on your own avatar, and know what's worth buying and what to sell.

A minimalist, mobile-first web app (PWA). Built for personal use first, on free tiers only.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn (Base UI), lucide icons
- Supabase: Postgres, Auth, Storage
- In-browser ML: `@imgly/background-removal`

## Setup

1. Install packages:
   ```bash
   npm install
   ```
2. Copy the env template and fill in the values from Supabase → Project Settings → API:
   ```bash
   cp .env.example .env.local
   ```
3. Link the Supabase CLI to the project and apply migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --remote
   ```
4. In Supabase → Authentication → Sign In / Providers → Email, turn off **Confirm email** (personal use).
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

## Supabase keep-alive

`.github/workflows/supabase-keepalive.yml` pings the database daily so the free tier doesn't pause. It needs two GitHub Actions secrets: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
