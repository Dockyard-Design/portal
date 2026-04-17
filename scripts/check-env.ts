/**
 * CI check: Ensure SUPABASE_SERVICE_ROLE_KEY is never exposed to the browser.
 *
 * Next.js exposes any env var prefixed with NEXT_PUBLIC_ to the client bundle.
 * The service role key bypasses all RLS policies and must remain server-only.
 *
 * Run: npx tsx scripts/check-env.ts
 * (Also called by `pnpm check`)
 */

function checkEnvSafety() {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    // Skip empty / unset values
    if (!value) continue;

    // Flag any NEXT_PUBLIC_ variable that looks like a Supabase service role key
    if (key.startsWith("NEXT_PUBLIC_") && value.startsWith("eyJ")) {
      errors.push(
        `SECURITY: ${key} looks like a Supabase service role key but is client-accessible (NEXT_PUBLIC_*)`
      );
    }
  }

  // Explicitly check that the service role key is NOT prefixed with NEXT_PUBLIC_
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const leakedKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (leakedKey) {
    errors.push(
      "SECURITY: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set — service role keys must never be client-accessible"
    );
  }

  // Warn if the service role key is empty in production-like contexts
  if (!serviceRoleKey && process.env.NODE_ENV === "production") {
    errors.push(
      "CONFIG: SUPABASE_SERVICE_ROLE_KEY is not set — API key auth will fall back to anon client (no RLS bypass)"
    );
  }

  if (errors.length > 0) {
    console.error("❌ Environment safety check failed:\n");
    for (const e of errors) {
      console.error(`  • ${e}`);
    }
    console.error();
    process.exit(1);
  }

  console.log("✅ Environment safety check passed — service role key is not client-accessible");
}

checkEnvSafety();