import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, logRequest, checkRateLimit } from "@/lib/api-keys";
import { authenticate, getRateLimitHeaders } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const start = Date.now();
  const { slug } = await params;
  const path = `/api/posts/${slug}`;
  const authResult = await authenticate(request);

  if (!authResult) {
    const elapsed = Date.now() - start;
    await logRequest({
      api_key_id: null,
      auth_method: "api-key",
      method: "GET",
      path,
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
      path,
      status_code: 429,
      response_time_ms: elapsed,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later." },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)) } }
    );
  }

  const isClerk = authResult.method === "clerk";
  const client = isClerk ? supabase : supabaseAdmin;

  let query = client
    .from("projects")
    .select("id, title, slug, content, excerpt, status, is_public, is_indexable, seo_title, seo_description, seo_keywords, featured_image_url, created_at, updated_at")
    .eq("slug", slug);

  if (!isClerk) {
    query = query.eq("status", "published").eq("is_public", true);
  }

  const { data, error } = await query.single();
  const elapsed = Date.now() - start;
  const statusCode = (error || !data) ? 404 : 200;

  await logRequest({
    api_key_id: authResult.keyId ?? null,
    auth_method: authResult.method,
    method: "GET",
    path,
    status_code: statusCode,
    response_time_ms: elapsed,
    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
  });

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404, headers: rateLimitHeaders });
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