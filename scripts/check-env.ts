/**
 * CI check: Ensure privileged Supabase keys are never exposed to the browser.
 *
 * Next.js exposes any env var prefixed with NEXT_PUBLIC_ to the client bundle.
 * Supabase secret/service-role keys bypass all RLS policies and must remain server-only.
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

  // Explicitly check that privileged keys are NOT prefixed with NEXT_PUBLIC_
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const leakedSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;
  const leakedKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (leakedSecretKey) {
    errors.push(
      "SECURITY: NEXT_PUBLIC_SUPABASE_SECRET_KEY is set — Supabase secret keys must never be client-accessible"
    );
  }
  if (leakedKey) {
    errors.push(
      "SECURITY: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set — service role keys must never be client-accessible"
    );
  }

  // Fail if the actual privileged key used by the app is empty in production-like contexts
  if (!secretKey && process.env.NODE_ENV === "production") {
    errors.push(
      "CONFIG: SUPABASE_SECRET_KEY is not set — server-side Supabase admin operations cannot run"
    );
  }

  if (serviceRoleKey && !secretKey && process.env.NODE_ENV === "production") {
    errors.push(
      "CONFIG: SUPABASE_SERVICE_ROLE_KEY is set but SUPABASE_SECRET_KEY is missing — this app reads SUPABASE_SECRET_KEY"
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

  console.log("✅ Environment safety check passed — privileged Supabase keys are not client-accessible");
}

checkEnvSafety();
