<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Closetify: project rules

## Before you start
- Read `PROJECT.md` first. It holds the plan, the decisions, the data model and the progress checklist.
- Work only on the **current milestone** (the first unchecked one in `PROJECT.md`). Don't build features from later milestones, even if they seem quick.
- When you finish a step, tick it in the progress checklist in `PROJECT.md`.
- If a request conflicts with a decision in `PROJECT.md`, say so and ask before changing course.

## Stack conventions
- Next.js 16 App Router, TypeScript, React 19. Route protection lives in `src/proxy.ts` (this version uses `proxy`, not `middleware`).
- Supabase: server client in `src/lib/supabase/server.ts`, browser client in `src/lib/supabase/client.ts`. Use `getClaims()` to read the signed-in user on the server.
- Mutations go through server actions in `src/app/actions/`. Validate input with `zod`.
- UI components: shadcn (`base-nova` style, built on Base UI) in `src/components/ui/`, icons from `lucide-react`, class merging with `cn` from `@/lib/utils`.

## Cost: free tier only
- No paid APIs. ML (background removal, CLIP, OCR) runs in the browser.
- Store images as compressed WebP. The Supabase free tier has 1 GB of storage.

## Database and storage
- Every schema change is a **new** migration file in `supabase/migrations/` (`YYYYMMDDHHMMSS_name.sql`). Never edit a migration that has already been applied.
- Every table has Row Level Security enabled, with policies written as `(select auth.uid()) = user_id`.
- Storage buckets are private. Object paths start with the user's id: `<user_id>/...`.
- Don't apply migrations yourself. Tell the user to run `npx supabase db push --remote`. Every CLI command for the live project needs `--remote`.

## Secrets
- Never commit `.env.local`. New env vars go into `.env.example` with an empty value.
- Only the anon key may appear in client code. Never use the `service_role` / secret key in this app.

## Design
- Minimalist and mobile-first. Off-white background (`#f7f6f3`), white cards, one accent color, a lot of white space.
- The clothes are the only color on screen.
- Bottom tab bar: Today · Closet · Outfits · Planner · Profile.
- Don't copy Alta's name, logo, screens or assets. Borrow patterns, not visuals.
- User-facing text is short and plain. Use the `no-ai-slop` skill for copy.

## Checks before saying a step is done
- `npm run lint` and `npx tsc --noEmit` pass.
- Logic like outfit rules and scoring gets `vitest` tests.
- Say what you couldn't verify (for example, that a migration still needs to be pushed).

## Git
- Don't commit or push unless the user asks.
- Never stage `.agents/`, `.cursor/`, `.claude/` or `skills-lock.json`.

## Useful skills
- `grill-me`: stress-test a milestone's plan before building it.
- `emil-design-eng`, `animate`: UI polish and motion.
- `no-ai-slop`: user-facing copy.
