/**
 * CI check: Ensure privileged storage and database keys are never exposed to the browser.
 *
 * Next.js exposes any env var prefixed with NEXT_PUBLIC_ to the client bundle.
 * Supabase secret/service-role keys bypass all RLS policies and must remain server-only.
 * Vercel Blob read-write tokens can upload/delete files and must remain server-only.
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

    // Flag any NEXT_PUBLIC_ variable that looks like a Vercel Blob read-write token
    if (key.startsWith("NEXT_PUBLIC_") && value.startsWith("store_")) {
      errors.push(
        `SECURITY: ${key} looks like a Vercel Blob read-write token but is client-accessible (NEXT_PUBLIC_*)`
      );
    }
  }

  // Explicitly check that privileged keys are NOT prefixed with NEXT_PUBLIC_
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const leakedSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;
  const leakedKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const leakedBlobToken = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN;
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
  if (leakedBlobToken) {
    errors.push(
      "SECURITY: NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN is set — Vercel Blob read-write tokens must never be client-accessible"
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

  if (!blobToken && process.env.NODE_ENV === "production") {
    errors.push(
      "CONFIG: BLOB_READ_WRITE_TOKEN is not set — image uploads to Vercel Blob cannot run"
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

  console.log("✅ Environment safety check passed — privileged keys are not client-accessible");
}

checkEnvSafety();
