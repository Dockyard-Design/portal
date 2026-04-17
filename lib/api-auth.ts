import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyApiKey } from "@/lib/api-keys";

export interface AuthResult {
  method: "api-key" | "clerk";
  keyId?: string;
  identifier: string;
}

/**
 * Authenticate a request by trying API key first, then falling back to Clerk session.
 *
 * Fix for #4 (auth bypass): When a Bearer token is provided but the API key is
 * invalid, we fall through to Clerk auth rather than immediately rejecting.
 * This ensures that a user with an invalid API key header who also has a valid
 * Clerk session cookie can still authenticate via Clerk.
 */
export async function authenticate(
  request: NextRequest
): Promise<AuthResult | null> {
  // Try API key first
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { valid, keyId } = await verifyApiKey(token);
    if (valid) {
      return { method: "api-key", keyId: keyId!, identifier: keyId! };
    }
    // Key was provided but invalid — fall through to Clerk auth
    // rather than returning null immediately (fixes #4)
  }

  // Try Clerk session
  try {
    const { userId } = await auth();
    if (userId) {
      return { method: "clerk", identifier: `clerk:${userId}` };
    }
  } catch {
    // Not in a Clerk context
  }

  return null;
}

export function getRateLimitHeaders(result: {
  remaining: number;
  limit: number;
  resetAt: Date;
}) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}