# Release Readiness Tracker

Last updated: 2026-04-19 20:20 Europe/London

## Verdict

Not release-ready yet. This implementation pass added the ordered migration, public Projects API, contact/project policies, role-aware dashboards, messaging, Resend and Blob integration, and regression coverage. Release is still blocked by Supabase advisor or equivalent verification against the real project.

## Verification Baseline

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm check:env`
- [x] `pnpm test` against `localhost:4567`
- [x] Git working tree clean before this remediation pass
- [x] Post-remediation `pnpm lint`
- [x] Post-remediation `pnpm typecheck`
- [x] Post-remediation `pnpm build`
- [x] Post-remediation `pnpm check:env`
- [x] Post-remediation `pnpm test` against `localhost:4567`

## Release Blockers

### Security: Supabase RLS

- [x] Enable RLS on every table in the public schema.
- [x] Add policies that match the app access model. Public policies are limited to published project reads and contact inserts; dashboard operations remain Clerk-gated server-side operations.
- [x] Avoid relying on the service-role client as the only security boundary for dashboard operations by adding Clerk admin authorization in server actions.
- [x] Explicitly restrict `SECURITY DEFINER` function execution from `PUBLIC`, `anon`, and `authenticated`.
- [ ] Verify with Supabase advisors or equivalent SQL checks against the real project.

Affected tables:

- `projects`
- `api_keys`
- `settings`
- `api_request_logs`
- `api_rate_limits`
- `customers`
- `kanban_boards`
- `kanban_tasks`
- `contact_submissions`
- `quotes`
- `quote_items`
- `invoices`
- `invoice_items`
- `expense_categories`
- `expenses`

### Security: Server Action Authorization

- [x] Add a shared authorization helper.
- [x] Require explicit admin access for project management.
- [x] Require explicit admin access for customer, board, and task management.
- [x] Require explicit admin access for quote and invoice management.
- [x] Require explicit admin access for expense management.
- [x] Require explicit admin access for contact submission management.
- [x] Require explicit admin access for API key management.
- [x] Require explicit admin access for Clerk user management.
- [x] Require explicit admin access for dashboard metrics.
- [x] Verify server actions do not rely only on page/proxy protection.

Implementation note: production admin access is granted by `DASHBOARD_ADMIN_USER_IDS` or Clerk user metadata with `admin: true`, `role: "admin"`, `role: "owner"`, or matching `roles`. Development remains permissive if no admin allowlist is configured.

### Security: API and Proxy

- [x] Stop bypassing Clerk for every `/api/*` route.
- [x] Allowlist only the intended public/API-key endpoints.
- [x] Keep PDF routes protected by Clerk and local authorization.
- [x] Audit every route handler for local auth and authorization.

### Security: Test API Key Bypass

- [x] Remove the always-known default fake API key from ordinary development.
- [x] Require explicit opt-in for test API key bypass.
- [x] Keep integration tests able to run against `localhost:4567`.
- [x] Verify the bypass cannot accidentally run in production.

Implementation note: start the local server for integration tests with `ALLOW_TEST_API_KEY=true TEST_API_KEY=sk_test_local_release_review_000000000000 pnpm dev`, then run `pnpm test`.

### Security: Environment Checks

- [x] Update env safety checks to validate `SUPABASE_SECRET_KEY`.
- [x] Keep checks for legacy `SUPABASE_SERVICE_ROLE_KEY` leaks.
- [x] Fail production checks when the actual privileged key is missing.

### Security: Headers and Production Config

- [x] Disable the `X-Powered-By` header.
- [x] Add `X-Content-Type-Options`.
- [x] Add `Referrer-Policy`.
- [x] Add a frame protection policy.
- [x] Add a production-appropriate CSP or document the rollout path.
- [x] Add cache-control headers for sensitive dashboard/API surfaces if needed.

### Database: Migration Readiness

- [x] Replace destructive reset SQL with ordered migrations before production deployment.
- [x] Keep `database/database.sql` usable for local reset only, or rename/document it clearly.
- [x] Add missing `generate_invoice_number` function or remove its use.
- [x] Fix the rate-limit RPC return shape mismatch.
- [x] Fix kanban task `position` type or reindexing strategy.

### Tests and Coverage

- [x] Add tests for server-action authorization.
- [x] Add tests for API allowlist/proxy behavior.
- [x] Add tests for invoice creation and invoice numbering.
- [x] Add tests for kanban drag/drop persistence.
- [x] Add tests or SQL assertions for RLS expectations.
- [x] Add regression coverage for contact submission admin actions.

## Remediation Log

### 2026-04-19

- Added `lib/authz.ts` with shared `requireUser()` and `requireAdmin()` helpers.
- Added admin checks to dashboard server actions, metrics, API key management, user management, contact management, and PDF routes.
- Changed proxy behavior so only `/api/contact`, `/api/posts`, and `/api/posts/*` bypass Clerk for API-key auth.
- Removed implicit acceptance of the hardcoded fake API key and required explicit `ALLOW_TEST_API_KEY=true` plus a non-default `TEST_API_KEY`.
- Updated `scripts/check-env.ts` to validate `SUPABASE_SECRET_KEY` and client-side leaks.
- Updated `database/database.sql` with RLS enablement, function execute restrictions, `generate_invoice_number()`, numeric kanban positions, and rate-limit compatibility.
- Updated rate-limit result handling to support table-returning RPC responses.
- Added production headers and disabled `X-Powered-By` in `next.config.ts`.
- Added static release-hardening tests for admin action guardrails, API proxy allowlisting, fake-key opt-in, and SQL RLS/function expectations.
- Added ordered migration coverage for extended projects and messaging tables.
- Added public Projects API with section/gallery fields while keeping writes behind Clerk-authenticated app actions.
- Added Clerk role metadata for Admin and Customer users, including company assignment by customer name in the UI.
- Added customer-focused dashboard metrics and a Messaging Centre with auto-replies, unread state, timestamps, and thread status management.
- Added Resend email helpers for contact submissions, project/quote/invoice form notifications, and customer quote/invoice sends.
- Added Vercel Blob image upload support for project featured images and section galleries.
- Rewrote README.md and updated .env.example for the new integration variables.
- Verified `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:env`, and `pnpm test` against local server port 4568 after migration application.

## Positive Baseline

- API keys are hashed before storage.
- API key revoke/delete checks ownership.
- Public post API filters API-key users to published and public posts.
- Current lint, typecheck, build, env check, and integration tests pass.

## Release Gate

Do not release until Supabase advisor or equivalent SQL verification has been completed against the real project, or explicitly accepted as a documented production risk.
