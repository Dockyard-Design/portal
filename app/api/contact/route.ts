import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin, verifyApiKey, checkRateLimit, logRequest } from "@/lib/api-keys";

const submissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  // 1. API Key Authentication
  const authResult = await verifyApiKey(token || "");
  if (!authResult.valid) {
    return handleResponse(401, { error: "Unauthorized: Invalid or missing API key" }, request, startTime);
  }

  const keyId = authResult.keyId!;

  // 2. Rate Limiting
  const rateLimit = await checkRateLimit(keyId);
  if (!rateLimit.allowed) {
    return handleResponse(429, { error: "Too many requests. Please try again later." }, request, startTime, rateLimit);
  }

  // 3. Validation
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return handleResponse(400, { error: "Invalid JSON body" }, request, startTime);
  }

  const validation = submissionSchema.safeParse(body);
  if (!validation.success) {
    return handleResponse(400, { error: "Validation failed", details: validation.error.format() }, request, startTime);
  }

  // 4. Database Insertion
  const { error: dbError } = await supabaseAdmin
    .from("contact_submissions")
    .insert({
      name: validation.data.name,
      email: validation.data.email,
      message: validation.data.message,
    });

  if (dbError) {
    console.error("[api/contact] DB Error:", dbError);
    return handleResponse(500, { error: "Internal server error while saving submission" }, request, startTime);
  }

  return handleResponse(201, { message: "Submission received successfully" }, request, startTime);
}

export async function GET(request: NextRequest) {
  return handleResponse(405, { error: "Method Not Allowed" }, request, Date.now());
}

/**
 * Helper to standardize responses and ensure every request is logged
 */
async function handleResponse(
  status: number,
  body: any,
  request: NextRequest,
  startTime: number,
  rateLimit?: any
) {
  const responseTime = Date.now() - startTime;

  // Log the request asynchronously
  logRequest({
    api_key_id: request.headers.get("authorization")?.replace("Bearer ", "") ? (await verifyApiKey(request.headers.get("authorization")?.replace("Bearer ", "") || "")).keyId || null : null,
    auth_method: "api-key",
    method: request.method,
    path: request.nextUrl.pathname,
    status_code: status,
    response_time_ms: responseTime,
    ip_address: request.headers.get("x-forwarded-for") || null,
    user_agent: request.headers.get("user-agent"),
  }).catch(err => console.error("[logRequest] failure:", err));

  const res = NextResponse.json(body, { status });

  if (rateLimit) {
    res.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    res.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    res.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt.getTime() / 1000)));
  } else {
    // Set default headers when rate limiting is bypassed
    res.headers.set("X-RateLimit-Limit", "9999");
    res.headers.set("X-RateLimit-Remaining", "9999");
    res.headers.set("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 60));
  }

  return res;
}
