import { describe, it, expect, beforeEach } from "vitest";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const VALID_API_KEY = process.env.TEST_API_KEY || "";
const INVALID_API_KEY = "sk_live_invalidkey00000000000000000000";

// Delay between tests to avoid rate limiting (100 req/min)
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
});

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  return fetch(url, { ...options });
}

function withApiKey(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}` };
}

describe("Contact Form API (/api/contact)", () => {
  describe("Authentication & Method Enforcement", () => {
    it("rejects GET requests with 405 Method Not Allowed", async () => {
      const res = await apiFetch("/api/contact", {
        method: "GET",
      });
      expect(res.status).toBe(405);
      const body = await res.json();
      expect(body.error).toMatch(/not allowed/i);
    });

    it("rejects POST requests with no auth (401)", async () => {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          email: "test@example.com",
          message: "Hello",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("rejects POST requests with an invalid API key (401)", async () => {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          ...withApiKey(INVALID_API_KEY),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test",
          email: "test@example.com",
          message: "Hello",
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("Submission Logic", () => {
    it("rejects submissions with invalid data (400)", async () => {
      if (!VALID_API_KEY) return;

      const invalidBodies = [
        { name: "", email: "test@example.com", message: "Hello" }, // Missing name
        { name: "Test", email: "invalid-email", message: "Hello" }, // Invalid email
        { name: "Test", email: "test@example.com", message: "" }, // Missing message
        { name: "Test" }, // Missing other fields
      ];

      for (const body of invalidBodies) {
        const res = await apiFetch("/api/contact", {
          method: "POST",
          headers: {
            ...withApiKey(VALID_API_KEY),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        expect(res.status).toBe(400);
      }
    });

    it("accepts a valid submission (201)", async () => {
      if (!VALID_API_KEY) return;

      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          ...withApiKey(VALID_API_KEY),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test-api@example.com",
          message: "This is a test submission via API",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.message).toMatch(/received successfully/i);
    });

    it("includes rate limit headers in the response", async () => {
      if (!VALID_API_KEY) return;

      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          ...withApiKey(VALID_API_KEY),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Rate Limit Test",
          email: "rate-limit@example.com",
          message: "Testing headers",
        }),
      });
      expect(res.headers.has("X-RateLimit-Limit")).toBe(true);
      expect(res.headers.has("X-RateLimit-Remaining")).toBe(true);
      expect(res.headers.has("X-RateLimit-Reset")).toBe(true);
    });
  });
});
