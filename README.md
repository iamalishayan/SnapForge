# SnapForge

SnapForge is a monorepo for an AI-assisted site publishing workflow.
It includes an admin app, a public sites app, shared packages for database, queue, AI, and utilities, plus scripts for local maintenance and data checks.

## Repository Layout

- `apps/admin` - internal admin dashboard and API routes
- `apps/sites` - public site renderer and revalidation route
- `packages/ai` - translation, keyword, and QA helpers
- `packages/db` - Supabase client helpers and DB services
- `packages/queue` - BullMQ queue and worker definitions
- `packages/shared` - shared alerts, GSC, and IndexNow helpers
- `scripts/` - local utilities such as DB seeding and verification

## Prerequisites

- Node.js 18 or newer
- pnpm
- Supabase CLI if you are working with the local Supabase project
- Vercel CLI if you are syncing or testing deployment settings locally

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create your local environment file:

```bash
cp .env.local.example .env.local
```

3. Fill in the required values in `.env.local`.

The most important variables are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `REVALIDATION_SECRET`
- `RESEND_API_KEY`
- `ALERT_EMAIL`
- `INDEXNOW_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `UPSTASH_REDIS_URL`

Keep `gsc-service-account.json` local only. It is intentionally ignored by git.

## Run The Apps

Start the admin app on port 3000:

```bash
pnpm dev:admin
```

Start the public sites app on port 3001:

```bash
pnpm dev:sites
```

Build the Next.js apps:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

## Utility Scripts

- `pnpm tsx scripts/test-db.ts` - verifies the Supabase connection and basic DB access
- `pnpm tsx scripts/seed-db.ts` - placeholder for seeding local development data
- `pnpm tsx scripts/add-site.ts` - placeholder for onboarding a new site


## Notes

- The repo uses a pnpm workspace defined in `pnpm-workspace.yaml`.
- `apps/admin` and `apps/sites` are separate Next.js apps with their own local ports.
- Generated Supabase CLI state under `supabase/.temp/` is ignored.
