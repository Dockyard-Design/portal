import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("Missing Supabase environment variables");
}

// Regular client — respects RLS, used for Clerk-authenticated reads
export const supabase = createClient(supabaseUrl, publishableKey);

// Admin client — bypasses RLS
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    })
  : supabase;

export interface RecentRequest {
  id: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  auth_method: string;
  created_at: string;
  api_key_id?: string;
  api_key?: {
    name: string;
    key_prefix: string;
  } | null;
}

export async function getRecentApiRequests(limit: number = 50): Promise<RecentRequest[]> {
  // First fetch the request logs
  const { data: logs, error: logsError } = await supabaseAdmin
    .from("api_request_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (logsError) {
    console.error("[getRecentApiRequests] Error:", logsError);
    return [];
  }

  if (!logs || logs.length === 0) return [];

  // Get unique api_key_ids
  const keyIds = [...new Set(logs.filter((log: any) => log.api_key_id).map((log: any) => log.api_key_id))];
  
  // Fetch key names if there are any
  let keysMap = new Map();
  if (keyIds.length > 0) {
    const { data: keys, error: keysError } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_prefix")
      .in("id", keyIds);
    
    if (!keysError && keys) {
      keysMap = new Map(keys.map((k: any) => [k.id, k]));
    }
  }

  // Merge the data
  return logs.map((log: any) => ({
    ...log,
    api_key: log.api_key_id ? keysMap.get(log.api_key_id) || { name: "Unknown Key", key_prefix: "----" } : null,
  }));
}

// ─── API Key Management ─────────────────────────────────────────────

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `sk_live_${nanoid(32)}`;
  const prefix = raw.slice(0, 12);
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
}

export async function verifyApiKey(bearerToken: string): Promise<{ valid: boolean; keyId?: string }> {
  if (!bearerToken) return { valid: false };

  const hash = hashApiKey(bearerToken);

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, is_active, expires_at")
    .eq("key_hash", hash)
    .single();

  if (error || !data) return { valid: false };
  if (!data.is_active) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false };

  // Atomically increment request_count and update last_used_at via RPC.
  // This avoids the read-then-write race condition and the operator-precedence
  // bug in `(data as any).request_count ?? 0 + 1` (#2, #3).
  supabaseAdmin
    .rpc("increment_api_key_request_count", { key_id: data.id })
    .then(({ error: rpcError }) => {
      if (rpcError) {
        console.error("[verifyApiKey] Failed to increment request_count:", rpcError.message);
      }
    });

  return { valid: true, keyId: data.id };
}

export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  request_count: number;
}

// ─── Rate Limiting ───────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

const RATE_LIMIT_WINDOW_SECONDS = 60; // 1-minute sliding window
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window per identifier

/**
 * Atomic sliding-window rate limiter backed by a Postgres RPC.
 * Eliminates the race condition in the previous select-then-update pattern (#2).
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  // Skip rate limiting in development/test or when env var is set
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || process.env.SKIP_RATE_LIMIT) {
    const now = new Date();
    return { allowed: true, remaining: 9999, limit: 9999, resetAt: new Date(now.getTime() + 60000) };
  }

  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_identifier: identifier,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || !data) {
    // If the RPC fails (e.g. migration not yet applied), log and allow the request
    // rather than blocking all traffic. This is a graceful degradation.
    console.error("[checkRateLimit] RPC failed, allowing request:", error?.message);
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);
    return { allowed: true, remaining: limit, limit, resetAt };
  }

  return {
    allowed: data.allowed,
    remaining: data.remaining,
    limit: data.limit,
    resetAt: new Date(data.reset_at),
  };
}

// ─── Request Logging ─────────────────────────────────────────────────

export interface RequestLog {
  api_key_id: string | null;
  auth_method: "api-key" | "clerk";
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  ip_address: string | null;
  user_agent: string | null;
}

export async function logRequest(log: RequestLog): Promise<void> {
  try {
    await supabaseAdmin.from("api_request_logs").insert({
      api_key_id: log.api_key_id,
      auth_method: log.auth_method,
      method: log.method,
      path: log.path,
      status_code: log.status_code,
      response_time_ms: log.response_time_ms,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
    });
  } catch {
    // Log failures should never block the request
  }
}

// ─── Analytics Queries ────────────────────────────────────────────────

export interface ApiMetrics {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: { path: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
  recentRequests: {
    id: string;
    method: string;
    path: string;
    status_code: number;
    response_time_ms: number;
    auth_method: string;
    created_at: string;
  }[];
  topKeys: {
    id: string;
    name: string;
    key_prefix: string;
    is_active: boolean;
    request_count: number;
    last_used_at: string | null;
  }[];
}

export async function getApiMetrics(days: number = 30): Promise<ApiMetrics> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Note: This query is capped at 500 rows for in-memory aggregation (#10).
  // As traffic grows, consider migrating to Supabase RPC with database-side
  // aggregation or materialized views for better performance.

  // Fetch all logs in the window
  const { data: logs, error } = await supabaseAdmin
    .from("api_request_logs")
    .select("id, method, path, status_code, response_time_ms, auth_method, created_at, api_key_id")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !logs) {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      successRate: 0,
      requestsByMethod: {},
      requestsByPath: [],
      requestsByDay: [],
      recentRequests: [],
      topKeys: [],
    };
  }

  const totalRequests = logs.length;
  const avgResponseTime = totalRequests > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / totalRequests)
    : 0;
  const successRate = totalRequests > 0
    ? Math.round((logs.filter((l) => l.status_code >= 200 && l.status_code < 400).length / totalRequests) * 100)
    : 0;

  // Group by method
  const requestsByMethod: Record<string, number> = {};
  for (const log of logs) {
    requestsByMethod[log.method] = (requestsByMethod[log.method] || 0) + 1;
  }

  // Group by path
  const pathMap: Record<string, number> = {};
  for (const log of logs) {
    pathMap[log.path] = (pathMap[log.path] || 0) + 1;
  }
  const requestsByPath = Object.entries(pathMap)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);

  // Group by day
  const dayMap: Record<string, number> = {};
  for (const log of logs) {
    const day = new Date(log.created_at).toISOString().slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;
  }
  const requestsByDay = Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent requests (last 10)
  const recentRequests = logs.slice(0, 10).map((l) => ({
    id: l.id,
    method: l.method,
    path: l.path,
    status_code: l.status_code,
    response_time_ms: l.response_time_ms || 0,
    auth_method: l.auth_method,
    created_at: l.created_at,
  }));

  // Top keys
  const keyIds = [...new Set(logs.map((l) => l.api_key_id).filter(Boolean))];
  let topKeys: ApiMetrics["topKeys"] = [];
  if (keyIds.length > 0) {
    const { data: keys } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_prefix, is_active, request_count, last_used_at")
      .in("id", keyIds);
    topKeys = (keys || []).map((k) => ({
      id: k.id,
      name: k.name,
      key_prefix: k.key_prefix,
      is_active: k.is_active,
      request_count: k.request_count ?? 0,
      last_used_at: k.last_used_at,
    }));
  }

  return {
    totalRequests,
    avgResponseTime,
    successRate,
    requestsByMethod,
    requestsByPath,
    requestsByDay,
    recentRequests,
    topKeys,
  };
}