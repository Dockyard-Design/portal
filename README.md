# Dockyard Portal

Admin portal for managing projects, API keys, and analytics.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the Supabase migration to create the required RPC functions:

```bash
psql -f supabase/migrations/001_atomic_increments.sql
```

> ⚠️ **Required migration**: The `increment_api_key_request_count` and `check_rate_limit` Postgres functions must be created before deploying. If these RPC functions are missing, API key verification and rate limiting will gracefully degrade (allowing all traffic but logging errors to the console).

4. Start the development server:

```bash
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm check:env` | Validate env vars (ensures service role key isn't client-accessible) |
| `pnpm check` | Run typecheck + lint + test + env check (CI-ready) |

## Architecture

- **Auth**: Clerk for dashboard sessions, API keys for external access
- **Database**: Supabase (Postgres) with RLS policies
- **Rate Limiting**: Atomic Postgres RPC (`check_rate_limit`) — no external services needed
- **Caching**: Dashboard metrics are cached with 60-second TTL via `unstable_cache`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (**never** prefix with `NEXT_PUBLIC_`) |
| `TEST_API_KEY` | No | API key for integration tests |

> 🔒 **Security**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It must **never** be prefixed with `NEXT_PUBLIC_` or it will be bundled into the client. The `pnpm check:env` script validates this at CI time.