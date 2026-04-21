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
    const projectTypes = read("types/project.ts");
    const projectForm = read("app/dashboard/projects/project-form.tsx");

    for (const source of [projectsRoute, projectRoute]) {
      expect(source).toContain("brief_text");
      expect(source).toContain("feedback_gallery");
      expect(source).not.toContain('"content"');
      expect(source).toContain("Project writes require Clerk-authenticated app actions");
    }

    expect(projectTypes).not.toContain("content: string");
    expect(projectForm).not.toContain('register("content")');
    expect(projectForm).toContain("brief_gallery: z.array(z.string().url()).max(4)");
    expect(projectForm).toContain("feedback_gallery: z.array(z.string().url()).max(4)");
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

  it("routes quote and invoice lifecycle updates through messaging instead of document emails", () => {
    const agency = read("app/actions/agency.ts");
    const schema = read("database/database.sql");
    const seed = read("database/seed.sql");

    expect(agency).not.toContain("sendDocumentEmail");
    expect(agency).not.toContain("sendFormSubmissionEmail");
    expect(agency).toContain("sendSupportMessageEmail");
    expect(agency).toContain("getOrCreateQuoteThread");
    expect(agency).toContain("addQuoteThreadMessage");
    expect(agency).toContain('quote_id: quote.id');
    expect(agency).toContain("threadUpdate.invoice_id = input.invoiceId");
    expect(agency).toContain("notifyCustomer: false");
    expect(agency).toContain("notifySupport: true");
    expect(agency).toContain("Quote accepted");
    expect(agency).toContain("Quote rejected");
    expect(agency).toContain("has been paid");
    expect(schema).toContain("quote_id UUID UNIQUE REFERENCES quotes(id)");
    expect(schema).toContain("invoice_id UUID REFERENCES invoices(id)");
    expect(seed).toContain("INSERT INTO message_threads");
  });

  it("keeps message email routing explicit for customer and support notifications", () => {
    const email = read("lib/email.ts");
    const messaging = read("app/actions/messaging.ts");

    expect(email).toContain('const SUPPORT_EMAIL = "support@dockyard.design"');
    expect(email).toContain('const NO_REPLY_EMAIL = "no-reply@dockyard.design"');
    expect(email).toContain("sendCustomerMessageEmail");
    expect(email).toContain("sendSupportMessageEmail");
    expect(messaging).toContain("sendMessageEmailNotification");
    expect(messaging).toContain('input.senderRole === "admin"');
    expect(messaging).toContain('input.senderRole === "system"');
    expect(messaging).toContain("sendSupportMessageEmail");
  });

  it("keeps the new reports page and navigation wired in", () => {
    const reportsPage = read("app/dashboard/reports/page.tsx");
    const sidebar = read("components/app-sidebar.tsx");

    expect(reportsPage).toContain("MonthlyReportRow");
    expect(reportsPage).toContain("Year Earnings");
    expect(reportsPage).toContain("Year Expenses");
    expect(reportsPage).toContain("Outstanding");
    expect(sidebar).toContain('title: "Reports"');
    expect(sidebar).toContain('href: "/dashboard/reports"');
  });

  it("keeps large create/edit flows out of project and quote modals", () => {
    const projectsTable = read("app/dashboard/projects/projects-table.tsx");
    const newProjectPage = read("app/dashboard/projects/new/page.tsx");
    const editProjectPage = read("app/dashboard/projects/[id]/page.tsx");
    const quotesWorkspace = read("app/dashboard/quotes/quotes-workspace.tsx");
    const newQuotePage = read("app/dashboard/quotes/new/page.tsx");

    expect(projectsTable).not.toContain("DialogContent");
    expect(projectsTable).toContain('href="/dashboard/projects/new"');
    expect(newProjectPage).toContain("NewProjectClient");
    expect(editProjectPage).toContain("EditProjectClient");
    expect(quotesWorkspace).toContain("/dashboard/quotes/new");
    expect(newQuotePage).toContain("NewQuoteClient");
  });

  it("keeps contact and messaging inbox refinements in place", () => {
    const contactInbox = read("app/dashboard/contact/contact-inbox.tsx");
    const messagesClient = read("app/dashboard/messages/messages-client.tsx");
    const kanbanBoard = read("app/dashboard/kanban/kanban-board.tsx");
    const globals = read("app/globals.css");

    expect(contactInbox).toContain("openSubmission");
    expect(contactInbox).toContain('updateSubmissionStatus(submission.id, "read")');
    expect(contactInbox).toContain('className="w-full rounded-lg border bg-background shadow-sm"');
    expect(contactInbox.match(/dashboard-scrollbar/g)?.length).toBeGreaterThanOrEqual(2);
    expect(messagesClient.match(/dashboard-scrollbar/g)?.length).toBeGreaterThanOrEqual(4);
    expect(kanbanBoard).toContain('SelectContent className="min-w-[320px]"');
    expect(globals).toContain(".dashboard-scrollbar");
  });

  it("does not render raw database IDs in audited dashboard surfaces", () => {
    const auditedFiles = [
      "components/app-sidebar.tsx",
      "app/dashboard/api-keys/api-keys-table.tsx",
      "app/dashboard/api-requests-table.tsx",
      "app/dashboard/customers/page.tsx",
      "app/dashboard/projects/projects-table.tsx",
      "app/dashboard/quotes/quotes-workspace.tsx",
      "app/dashboard/invoices/invoices-workspace.tsx",
      "app/dashboard/users/users-table.tsx",
    ];

    for (const file of auditedFiles) {
      const source = read(file);
      expect(source, file).not.toMatch(/>\s*(?:ID|Id)\s*</);
      expect(source, file).not.toMatch(/(?:Customer|Project|Quote|Invoice|Thread|User)\s+ID/);
      expect(source, file).not.toMatch(/\.slice\(0,\s*8\)/);
    }
  });
});
