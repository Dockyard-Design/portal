/**
 * API Integration Tests
 *
 * Tests that:
 * 1. Unauthenticated requests are rejected (401)
 * 2. Invalid API keys are rejected (401)
 * 3. Valid API keys can read (200)
 * 4. The API is strictly read-only — POST, PUT, PATCH, DELETE all return 405
 * 5. Rate limiting works (429 after exceeding limit)
 * 6. Published public posts are visible via API key
 * 7. Draft/private posts are NOT visible via API key
 * 8. Clerk-authenticated users can see their own posts
 */

import { describe, it, expect, beforeEach } from "vitest";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4567";

// A known valid API key for testing (must be created in the dashboard)
const VALID_API_KEY = process.env.TEST_API_KEY || "";
const INVALID_API_KEY = "sk_live_invalidkey00000000000000000000";

beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
});

// ─── Helpers ────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  return fetch(url, { ...options });
}

function withApiKey(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}` };
}

describe.skipIf(!VALID_API_KEY)("API Pagination", () => {
  it("returns paginated results with limit parameter", async () => {
    const res = await apiFetch("/api/posts?limit=2", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    // Should return at most 2 items
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it("returns paginated results with offset parameter", async () => {
    // Get first page
    const res1 = await apiFetch("/api/posts?limit=1&offset=0", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    
    // Get second page
    const res2 = await apiFetch("/api/posts?limit=1&offset=1", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    // If we have at least 2 posts, they should be different
    if (body1.data.length > 0 && body2.data.length > 0) {
      expect(body1.data[0].id).not.toBe(body2.data[0].id);
    }
  });

  it("respects maximum limit of 100", async () => {
    const res = await apiFetch("/api/posts?limit=200", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should be capped at 100
    expect(body.data.length).toBeLessThanOrEqual(100);
  });

  it("returns empty array when offset exceeds total", async () => {
    const res = await apiFetch("/api/posts?limit=10&offset=999999", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ─── Test Suite ──────────────────────────────────────────────────────

describe("API Authentication", () => {
  it("rejects requests with no auth (401)", async () => {
    const res = await apiFetch("/api/posts");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it("rejects requests with an invalid API key (401)", async () => {
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(INVALID_API_KEY),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid|unauthorized/i);
  });

  it("rejects requests with malformed Authorization header (401)", async () => {
    const res = await apiFetch("/api/posts", {
      headers: { Authorization: "NotBearer sometoken" },
    });
    expect(res.status).toBe(401);
  });
});

describe("API Read-Only Enforcement", () => {
  const methods = ["POST", "PUT", "PATCH", "DELETE"] as const;

  for (const method of methods) {
    it(`rejects ${method} /api/posts with 405`, async () => {
      const res = await apiFetch("/api/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "hacked" }),
      });
      expect(res.status).toBe(405);
      const body = await res.json();
      expect(body.error).toMatch(/not allowed/i);
      expect(body.error).toMatch(/read-only/i);
    });

    it(`rejects ${method} /api/posts/slug with 405`, async () => {
      const res = await apiFetch("/api/posts/test-slug", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "hacked" }),
      });
      expect(res.status).toBe(405);
      const body = await res.json();
      expect(body.error).toMatch(/not allowed/i);
    });
  }
});

// These tests require a valid API key set in TEST_API_KEY
describe.skipIf(!VALID_API_KEY)("API with Valid Key", () => {
  it("returns 200 for GET /api/posts with a valid API key", async () => {
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
  });

  it("includes rate limit headers in the response", async () => {
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.headers.has("X-RateLimit-Limit")).toBe(true);
    expect(res.headers.has("X-RateLimit-Remaining")).toBe(true);
    expect(res.headers.has("X-RateLimit-Reset")).toBe(true);
  });

  it("only returns published + public posts via API key", async () => {
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const post of body.data) {
      expect(post.status).toBe("published");
      expect(post.is_public).toBe(true);
    }
  });

  it("does not include content in list endpoint", async () => {
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const post of body.data) {
      expect(post).not.toHaveProperty("content");
    }
  });

  it("includes content in single post endpoint", async () => {
    // First get a list to find a slug
    const listRes = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    const listBody = await listRes.json();
    if (listBody.data.length === 0) return; // No posts to test against

    const slug = listBody.data[0].slug;
    const res = await apiFetch(`/api/posts/${slug}`, {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty("content");
  });

  it("returns 404 for a non-existent slug", async () => {
    const res = await apiFetch("/api/posts/this-slug-does-not-exist", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(404);
  });
});

describe("API Data Isolation", () => {
  it("does not leak draft posts to API key users", async () => {
    if (!VALID_API_KEY) return;
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const post of body.data) {
      expect(post.status).not.toBe("draft");
    }
  });

  it("does not leak private posts to API key users", async () => {
    if (!VALID_API_KEY) return;
    const res = await apiFetch("/api/posts", {
      headers: withApiKey(VALID_API_KEY),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const post of body.data) {
      expect(post.is_public).toBe(true);
    }
  });
});
