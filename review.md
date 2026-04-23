# Security Audit

Date: 2026-04-22

Scope: application code, route handlers, server actions, authentication and authorization boundaries, environment/secret handling, dependency advisories, Vercel Blob upload handling, and `database/database.sql`.

## Findings

### 1. High: any signed-in Clerk user can read private/draft project API data

`proxy.ts` marks `/api/posts` and `/api/projects` as public API routes, so middleware skips `auth.protect()`. The route-level helper then treats any Clerk session as privileged. In the posts and projects API routes, the `published/is_public` filter is skipped for Clerk users.

Affected code:

- `proxy.ts:21`
- `lib/api-auth.ts:35`
- `app/api/posts/route.ts:51`
- `app/api/posts/[slug]/route.ts:56`
- `app/api/projects/route.ts:60`

Impact:

Customer accounts can query draft/private project data. `/api/posts/[slug]` also includes `content`, so private post content can be exposed to any authenticated Clerk user.

Recommended fix:

Only skip public filters for users that pass `requireAdmin()`, or make these API endpoints API-key/public-read only and keep Clerk customer sessions on the filtered path.

### 2. High: direct Supabase inserts can bypass contact API controls

The contact endpoint requires a valid API key before inserting submissions, but `database.sql` also grants direct RLS insert access with `WITH CHECK (true)`.

Affected code:

- `app/api/contact/route.ts:29`
- `database/database.sql:483`

Impact:

If the Supabase URL and publishable key are available, callers can insert directly into `contact_submissions` and bypass the API-key requirement, request logging, email handling, and rate limiting.

Recommended fix:

Remove the public insert policy and keep contact submissions service-role only through `/api/contact`, or add database-side abuse controls that match the API policy.

### 3. Medium: `SECURITY DEFINER` functions live in the exposed `public` schema

`increment_api_key_request_count` and `check_rate_limit` are defined as `SECURITY DEFINER` functions in `public`. They are revoked from `PUBLIC`, `anon`, and `authenticated`, which helps, but privileged definer functions should not live in an exposed schema. These functions also do not set an explicit `search_path`.

Affected code:

- `database/database.sql:132`
- `database/database.sql:143`
- `database/database.sql:487`

Impact:

This increases the blast radius of future grants or search-path mistakes around privileged database code.

Recommended fix:

Move privileged RPCs to a private schema, or at minimum add a fixed `SET search_path = public, pg_temp` and grant execute only to the intended server role.

### 4. Medium: first-login password requirement can be cleared without proving the password changed

`completeInitialPasswordChange` only requires a signed-in user, then clears `initialPasswordChangeRequired` in Clerk metadata.

Affected code:

- `app/actions/users.ts:258`
- `app/actions/users.ts:267`

Impact:

If a customer invokes that server action directly, they can remove the password-change prompt without changing the temporary password.

Recommended fix:

Only clear this flag after a verified password update flow, or make the action verify a recent Clerk password-change event/state before updating metadata.

### 5. Medium: public Blob uploads trust client MIME type and allow all `image/*`

`uploadImageToBlob` accepts any `image/*`, then stores the file publicly with a long cache lifetime.

Affected code:

- `app/actions/blob.ts:34`
- `app/actions/blob.ts:47`

Impact:

An admin session can upload SVG or spoofed image content into public Blob storage. Since uploaded files are public and long-cacheable, bad content can persist even after a mistake.

Recommended fix:

Whitelist raster types such as JPEG, PNG, and WebP. Verify file signatures server-side, reject SVG, and set the stored content type from verified bytes instead of trusting `File.type`.

### 6. Low: destructive reset SQL sits in `database.sql`

`database/database.sql` starts with `DROP TABLE ... CASCADE` statements across production tables.

Affected code:

- `database/database.sql:1`

Impact:

The file is clearly labeled as a reset script, but it is dangerous to run against the wrong database.

Recommended fix:

Rename it to something explicit like `database/reset.sql`, keep migration SQL separate, and add a guard comment or tooling check so it cannot be run in production by mistake.

### 7. Low: admin-only updates use broad object updates in a few places

Some admin-only server actions pass incoming update objects directly into Supabase. They are admin-only, so this is not a customer escalation, but server actions are callable endpoints and TypeScript types do not enforce runtime shape.

Affected code:

- `app/actions/kanban.ts:223`
- `app/actions/kanban.ts:445`

Impact:

Unexpected properties can reach database update calls if a caller bypasses the UI and invokes the action directly.

Recommended fix:

Validate update payloads with Zod or manually whitelist fields before `.update()`.

## Positive Checks

- `database/database.sql` enables RLS on all public business tables at `database/database.sql:461`.
- Service-role Supabase usage is mostly wrapped behind Clerk role checks in server actions.
- API keys are stored hashed, not plaintext, in `lib/api-keys.ts:130`.
- Vercel Blob token and Supabase secret exposure checks exist in `scripts/check-env.ts:35`.

## Verification Run

- `pnpm audit --prod`: no known vulnerabilities found.
- `pnpm check:env`: passed, privileged keys are not client-accessible in the current environment.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
