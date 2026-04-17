# Dockyard Portal — Code Review

**Date:** 2025-04-17
**Scope:** Full project walkthrough

---

## Critical / Security

### 1. Supabase service role key exposed in `.env.local`
**File:** `.env.local`
The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It's currently used in `lib/api-keys.ts` for API key verification and rate limiting — which is correct — but it's also shipped as a client-accessible env var via `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Double-check that the service role key is **never** prefixed with `NEXT_PUBLIC_` and is never leaked to the browser bundle. Currently fine, but worth a CI check.

### 2. Rate limiter has a race condition
**File:** `lib/api-keys.ts` → `checkRateLimit()`
The upsert-based sliding window does a `select` then conditional `upsert`/`update`. Under concurrent requests, two threads can both pass the count check before either increments, allowing ~2× the intended limit. **Fix:** Use a Postgres function with `UPDATE ... SET request_count = request_count + 1` in a single atomic statement, or use `pg_advisory_lock` for the identifier.

### 3. `verifyApiKey` increments `request_count` with a stale read
**File:** `lib/api-keys.ts` → `verifyApiKey()`
```ts
supabaseAdmin.from("api_keys").update({
  request_count: (data as any).request_count ?? 0 + 1,
  last_used_at: new Date().toISOString()
})
```
`(data as any).request_count ?? 0 + 1` has operator precedence: `?? 0` binds tighter than `+1`, so it becomes `request_count ?? (0 + 1)` → `1` when `request_count` is null. But worse, this is a read-then-write race — concurrent requests will undercount. **Fix:** Use an atomic SQL increment via an RPC function.

### 4. API key auth bypass for invalid tokens
**File:** `app/api/posts/route.ts` → `authenticate()`
When a `Bearer` token is provided but `verifyApiKey` returns `{ valid: false }`, the function returns `null` immediately without trying Clerk auth. This means a user with an invalid API key header who *also* has a valid Clerk session cookie will be rejected. **Fix:** Only return `null` for invalid keys if there's no Clerk session; fall through to Clerk auth when the key is invalid.

---

## Bugs / Logic Errors

### 5. `next/image` missing `priority` on sign-in logo
**Files:** `app/page.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`
The logo is above the fold on the most important page (sign-in). Add `priority` to skip lazy-loading and improve LCP:
```tsx
<Image src="/logo.svg" alt="Dockyard" width={320} height={80} priority className="..." />
```

### 6. `signIn` could be `null` on initial render
**Files:** `app/page.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`
`useSignIn()` returns a `NullableSignInSignal` where `signIn` can be `null` before Clerk loads. The current code does `signIn.create(...)` without guarding. Wrap the form in a conditional or add early return:
```tsx
if (!signIn) return <LoadingSpinner />;
```

### 7. Duplicate Supabase client exports
**Files:** `lib/supabase.ts` and `lib/api-keys.ts`
Both files create and export a `supabase` client with the same URL/publishable key. This creates two separate Supabase connections. **Fix:** Remove `lib/supabase.ts` and import `supabase` from `lib/api-keys.ts`, or vice versa. Pick one canonical source.

### 8. `request_count` column may not exist on all queries
**File:** `lib/api-keys.ts` → `getApiMetrics()`
The `topKeys` query selects `request_count` from `api_keys`, but this column was added via `ALTER TABLE ADD COLUMN IF NOT EXISTS` in a migration. If the migration hasn't been run, this query will error silently and return empty `topKeys`. **Fix:** Add a migration script or document the required migration step in README.

### 9. `featured_image_url` validation edge case
**File:** `app/dashboard/projects/project-form.tsx`
```ts
featured_image_url: z.string().url("Invalid URL").or(z.string().length(0))
```
A single space `" "` would pass `length(0)` check... actually `.length(0)` requires exactly 0 chars, so `" "` would fail. This is actually fine but unclear. Consider `.url().or(z.literal(""))` for clarity.

---

## Performance

### 10. N+1 query in `getApiMetrics()`
**File:** `lib/api-keys.ts` → `getApiMetrics()`
After fetching up to 500 log rows, a second query fetches API keys by IDs. This is fine (1+1 = 2 queries), but the entire function does in-memory aggregation over 500 rows. As traffic grows, this will slow down. **Fix:** Consider Supabase RPC or materialized views. For now, the 500-row cap keeps it acceptable.

### 11. Fire-and-forget `request_count` update
**File:** `lib/api-keys.ts` → `verifyApiKey()`
```ts
supabaseAdmin.from("api_keys").update({...}).eq("id", data.id).then(() => {});
```
Errors are silently swallowed. If Supabase is down, request counts stop incrementing silently. Acceptable for analytics, but worth a `console.error` or logging pipeline.

### 12. `getDashboardApiMetrics` called on every dashboard page load
**File:** `app/dashboard/page.tsx`
`getDashboardApiMetrics()` does several Supabase queries with a `.catch(() => default)` fallback. This runs on every server render. Consider caching with `revalidateTag` or `unstable_cache` with a 60s TTL to reduce database load.

---

## UX / Design

### 13. Sign-in form doesn't handle `signIn === null` gracefully
**Files:** `app/page.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`
When Clerk hasn't loaded yet, the form renders with a disabled button but still shows empty input fields. A proper loading skeleton or spinner would feel more polished.

### 14. No "Forgot password?" link on sign-in
Since this is an invite-only portal, it may be intentional. But if Clerk supports password reset flows, a subtle link would reduce admin support burden. Add it only if the Clerk Forgot Password flow is enabled in the dashboard.

### 15. Sidebar UserButton click hack is fragile
**File:** `components/app-sidebar.tsx`
```ts
onClick={() => document.querySelector('[data-clerk-user-button]')?.querySelector('button')?.click()}
```
This DOM-reaching hack will break if Clerk changes their markup. **Fix:** Use Clerk's `useUser()` hook or the `UserButton` component directly in a more conventional layout slot rather than programmatic click simulation.

### 16. Project form "Cancel" button does nothing
**File:** `app/dashboard/projects/project-form.tsx`
The Cancel `<Button type="button">` has no `onClick` handler. It should close the parent dialog. Clicking Cancel does nothing visible. **Fix:** Accept an `onCancel` prop and pass `() => setOpen(false)` from the dialog parent.

### 17. `expanded` state resets on every navigation
**Files:** `components/expandable-project-list.tsx`, `components/expandable-request-list.tsx`
Each list uses `useState` for the `expanded` toggle. If the dashboard page re-renders (e.g., after `router.refresh()`), the toggle resets. Not a big deal but worth noting.

---

## Code Quality / DX

### 18. No consistent error boundary or toast for server action failures
Server actions throw raw `Error` objects. Client code catches them and shows `toast.error(error.message)`. Raw Supabase error messages (e.g., `"A project with this slug already exists"`) leak to the user. **Fix:** Create a typed error mapping or sanitize error messages before display.

### 19. `as any` type assertion in `updateProject`
**File:** `app/actions/projects.ts`
```ts
const { author_id, ...safeUpdates } = updates as any;
```
Using `as any` suppresses type safety. **Fix:** Use `Omit<Project, 'id' | 'updated_at' | 'author_id'>` as the update type, or define a dedicated `ProjectUpdate` type.

### 20. Duplicate `authenticate()` and `getRateLimitHeaders()` across route files
**Files:** `app/api/posts/route.ts`, `app/api/posts/[slug]/route.ts`
Both files define identical `authenticate()` and `getRateLimitHeaders()` functions. **Fix:** Extract these to `lib/api-auth.ts` and import them.

### 21. No convention for public vs protected routes
**File:** `proxy.ts`
The `isPublicRoute` check uses a whitelist (`/`, `/sign-in`). All other routes call `auth.protect()`. This works but requires manual updates for new public pages. Consider a route-group convention (e.g., `(public)` folder) or metadata-based approach.

### 22. Sign-up redirect is broad
**File:** `proxy.ts`
Any `/sign-up*` path redirects to `/`. This blocks Clerk's hosted sign-up page entirely, which is the intent. But if Clerk's OAuth callback URLs ever hit `/sign-up`, they'd be redirected too. Low risk, but worth a code comment.

### 23. Vitest config loads `.env.local` via `dotenv`
**File:** `vitest.config.ts`
This works but is fragile. Consider using Vitest's built-in `env` config option or a `.env.test` file instead of manual `dotenv` loading.

### 24. Missing combined check script
Now fixed: `pnpm typecheck` runs `tsc --noEmit`, `pnpm test` runs Vitest. Consider adding a `pnpm check` script that runs `typecheck && lint && test` for CI.

---

## Summary

| Priority | Count | Areas |
|----------|-------|-------|
| 🔴 Critical | 4 | Race conditions in rate limiter & request counter, auth bypass, service key exposure |
| 🟡 Bug | 4 | Null signIn guard, duplicate Supabase clients, missing migration, URL validation |
| 🟠 Performance | 3 | N+1 tolerable for now, fire-and-forget, uncached metrics |
| 🔵 UX | 4 | Loading state, forgot password, sidebar hack, broken cancel |
| ⚪ DX | 5 | Error messages, `as any`, duplicated auth logic, env config, scripts |

**Recommended next steps:**
1. Fix the rate limiter race condition (#2) and atomic request counter (#3)
2. Fix the auth bypass for invalid API key + valid Clerk session (#4)
3. Add null guard for `signIn` (#6)
4. Extract shared API auth helpers (#20)
5. Fix the Cancel button in project form (#16)
6. Run `pnpm typecheck && pnpm test` in CI (#24)