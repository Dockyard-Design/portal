import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, supabaseAdmin, verifyApiKey, logRequest, checkRateLimit } from "@/lib/api-keys";

async function authenticate(request: NextRequest): Promise<{ method: "api-key" | "clerk"; keyId?: string; identifier: string } | null> {
  // Try API key first
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token) {
    const { valid, keyId } = await verifyApiKey(token);
    if (valid) return { method: "api-key", keyId: keyId!, identifier: keyId! };
    return null;
  }

  // Try Clerk session
  try {
    const { userId } = await auth();
    if (userId) return { method: "clerk", identifier: `clerk:${userId}` };
  } catch {
    // Not in a Clerk context
  }

  return null;
}

function getRateLimitHeaders(result: { remaining: number; limit: number; resetAt: Date }) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  const authResult = await authenticate(request);

  if (!authResult) {
    const elapsed = Date.now() - start;
    await logRequest({
      api_key_id: null,
      auth_method: "api-key",
      method: "GET",
      path: "/api/posts",
      status_code: 401,
      response_time_ms: elapsed,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { error: "Unauthorized. Provide an API key or sign in." },
      { status: 401 }
    );
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(authResult.identifier);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    const elapsed = Date.now() - start;
    await logRequest({
      api_key_id: authResult.keyId ?? null,
      auth_method: authResult.method,
      method: "GET",
      path: "/api/posts",
      status_code: 429,
      response_time_ms: elapsed,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later.", retry_after: Math.ceil(rateLimit.resetAt.getTime() / 1000) },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)) } }
    );
  }

  const isClerk = authResult.method === "clerk";
  const client = isClerk ? supabase : supabaseAdmin;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = client
    .from("projects")
    .select("id, title, slug, excerpt, status, is_public, seo_title, seo_description, seo_keywords, featured_image_url, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!isClerk) {
    query = query.eq("status", "published").eq("is_public", true);
  }

  const { data, error } = await query;
  const elapsed = Date.now() - start;

  await logRequest({
    api_key_id: authResult.keyId ?? null,
    auth_method: authResult.method,
    method: "GET",
    path: "/api/posts",
    status_code: error ? 500 : 200,
    response_time_ms: elapsed,
    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500, headers: rateLimitHeaders });
  }

  return NextResponse.json({ data }, { headers: rateLimitHeaders });
}

// ─── Read-only enforcement ──────────────────────────────────────────

export async function POST() {
  return NextResponse.json({ error: "Method not allowed. The API is read-only." }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed. The API is read-only." }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed. The API is read-only." }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed. The API is read-only." }, { status: 405 });
}