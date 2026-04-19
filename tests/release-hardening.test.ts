import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("release hardening guardrails", () => {
  it("keeps dashboard server actions behind shared admin authorization", () => {
    const files = [
      "app/actions/agency-metrics.ts",
      "app/actions/agency.ts",
      "app/actions/api-keys.ts",
      "app/actions/contact.ts",
      "app/actions/expense-metrics.ts",
      "app/actions/expenses.ts",
      "app/actions/kanban-metrics.ts",
      "app/actions/kanban.ts",
      "app/actions/metrics.ts",
      "app/actions/projects.ts",
      "app/actions/users.ts",
    ];

    for (const file of files) {
      expect(read(file), file).toContain("requireAdmin");
    }
  });

  it("keeps API proxy bypass limited to the public API-key endpoints", () => {
    const proxy = read("proxy.ts");

    expect(proxy).toContain("isPublicApiRoute");
    expect(proxy).toContain('pathname === "/api/contact"');
    expect(proxy).toContain('pathname === "/api/posts"');
    expect(proxy).not.toContain('pathname.startsWith("/api/")');
  });

  it("keeps the fake API key behind explicit opt-in", () => {
    const apiKeys = read("lib/api-keys.ts");

    expect(apiKeys).toContain("ALLOW_TEST_API_KEY");
    expect(apiKeys).toContain("configuredTestKey !== DEFAULT_TEST_API_KEY");
    expect(apiKeys).not.toContain("bearerToken === DEFAULT_TEST_API_KEY");
  });

  it("keeps database release schema protections in place", () => {
    const schema = read("database/database.sql");

    expect(schema).toContain("CREATE OR REPLACE FUNCTION generate_invoice_number");
    expect(schema).toContain("position NUMERIC(12, 4) NOT NULL DEFAULT 0");
    expect(schema.match(/ENABLE ROW LEVEL SECURITY/g)?.length).toBeGreaterThanOrEqual(15);
    expect(schema).toContain("REVOKE ALL ON FUNCTION check_rate_limit");
  });
});
