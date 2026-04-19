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
    expect(proxy).toContain('pathname === "/api/projects"');
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
    expect(schema).toContain("CREATE POLICY \"Public can read published projects\"");
    expect(schema).toContain("CREATE POLICY \"Public can create contact submissions\"");
  });

  it("tracks ordered migrations instead of relying only on the reset script", () => {
    const migration = read("database/migrations/20260419170000_extended_projects_messaging.sql");

    expect(migration).toContain("ALTER TABLE projects");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS message_threads");
    expect(migration).toContain("CREATE POLICY \"Public can read published projects\"");
  });

  it("adds extended project API fields and keeps writes private", () => {
    const projectsRoute = read("app/api/projects/route.ts");
    const projectRoute = read("app/api/projects/[slug]/route.ts");

    for (const source of [projectsRoute, projectRoute]) {
      expect(source).toContain("brief_text");
      expect(source).toContain("feedback_gallery");
      expect(source).toContain("Project writes require Clerk-authenticated app actions");
    }
  });

  it("covers invoice numbering and kanban drag persistence code paths", () => {
    const agency = read("app/actions/agency.ts");
    const kanban = read("app/actions/kanban.ts");

    expect(agency).toContain('rpc("generate_invoice_number"');
    expect(agency).toContain("invoice_number: invoiceNumber");
    expect(kanban).toContain("export async function moveTask");
    expect(kanban).toContain("position: newPosition");
  });

  it("keeps contact admin mutations guarded", () => {
    const contact = read("app/actions/contact.ts");

    expect(contact.match(/requireAdmin/g)?.length).toBeGreaterThanOrEqual(5);
    expect(contact).toContain("updateSubmissionStatus");
    expect(contact).toContain("toggleArchiveSubmission");
    expect(contact).toContain("deleteSubmission");
  });

  it("stores user-facing customer names in sidebar labels", () => {
    const sidebar = read("components/app-sidebar.tsx");

    expect(sidebar).toContain("customer.name");
    expect(sidebar).toContain("board.name");
    expect(sidebar).toContain("localeCompare");
  });
});
