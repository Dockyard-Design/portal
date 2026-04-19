import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, logRequest, checkRateLimit } from "@/lib/api-keys";
import { authenticate, getRateLimitHeaders } from "@/lib/api-auth";

const PROJECT_SELECT = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "status",
  "is_public",
  "is_indexable",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "featured_image_url",
  "brief_text",
  "brief_gallery",
  "prototyping_text",
  "prototyping_gallery",
  "building_text",
  "building_gallery",
  "feedback_text",
  "feedback_gallery",
  "created_at",
  "updated_at",
].join(", ");

export async function GET(request: NextRequest) {
  const start = Date.now();
  const authResult = await authenticate(request);

  if (!authResult) {
    await logProjectRequest(request, null, "api-key", 401, start);
    return NextResponse.json({ error: "Unauthorized. Provide an API key or sign in." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(authResult.identifier);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    await logProjectRequest(request, authResult.keyId ?? null, authResult.method, 429, start);
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later." },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

  let query = supabaseAdmin
    .from("projects")
    .select(PROJECT_SELECT)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (authResult.method !== "clerk") {
    query = query.eq("status", "published").eq("is_public", true);
  }

  const { data, error } = await query;
  await logProjectRequest(request, authResult.keyId ?? null, authResult.method, error ? 500 : 200, start);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500, headers: rateLimitHeaders });
  }

  return NextResponse.json({ data }, { headers: rateLimitHeaders });
}

export async function POST() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: "Method not allowed. Project writes require Clerk-authenticated app actions." },
    { status: 405 }
  );
}

async function logProjectRequest(
  request: NextRequest,
  apiKeyId: string | null,
  authMethod: "api-key" | "clerk",
  statusCode: number,
  start: number
) {
  await logRequest({
    api_key_id: apiKeyId,
    auth_method: authMethod,
    method: request.method,
    path: request.nextUrl.pathname,
    status_code: statusCode,
    response_time_ms: Date.now() - start,
    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
  });
}
