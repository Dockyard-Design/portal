# Release Review

Date: 2026-04-20
Project: Dockyard customer/admin portal

## Readiness Verdict

This project is closer to a controlled beta than a real-customer production launch. The core workflows are present: Clerk-backed internal/customer access, customer records, kanban boards, quotes, invoices, expenses, projects, contact submissions, messaging, API-key access, and reporting. The implementation now removes quote/invoice document emails in favour of message-thread updates, adds customer/support email notifications for messages, and adds dedicated create/edit pages where large modal workflows were blocking usability.

Recommended readiness: **private beta with seed/test data only**. Do not onboard real paying customers until the remaining operational and security items below are closed.

## Feature Review

Working or materially improved:

- Customer/admin separation exists through Clerk and server-side authorization helpers.
- Quotes create message threads and append lifecycle messages for creation, updates, accept/reject, invoice creation, and invoice payment.
- Messaging now sends customer notifications from `no-reply@dockyard.design` and support notifications when customers write in.
- Project create/edit now uses dedicated pages, and project content is modelled through the four dedicated sections rather than a generic `content` field.
- Reports page now shows monthly earnings, expenses, profit, yearly totals, and outstanding balances.
- Contact submissions now behave more like an inbox: opening a new item marks it read, keeps it selected, and refreshes counts.
- UI scrollbar styling is now consistent across messaging and contact inner panels.

Remaining product gaps before production:

- Payment handling is still a portal state transition, not a verified payment provider integration or bank reconciliation workflow.
- Email delivery has no bounce/complaint handling and no audit table for notification failures.
- Quote/invoice lifecycle messaging is system-generated; customer/admin attribution could be more explicit in the thread UI.
- Reporting is useful but basic: no export, no date filters, no tax/VAT breakdown, and no cash/accrual toggle.
- No end-to-end browser coverage for mobile/tablet workflows.

## Code Review

Strengths:

- Server actions consistently check authorization for admin/customer boundaries.
- API write paths are read-only where public API keys are used.
- TypeScript, ESLint, and the HTTP test suite pass.
- Project and messaging types were extended instead of leaving untyped payloads in UI code.

Risks fixed in this pass:

- Removed direct quote/invoice form/document email sends so document events flow through the messaging system.
- Added schema links between quote threads and quote/invoice records.
- Removed the project `content` field from API selection, TypeScript types, form schema, database schema, and seed data.
- Replaced project creation/editing modals with dedicated pages.
- Added a dedicated quote creation page.

Remaining code risks:

- The app relies heavily on the Supabase service role from server actions. This is acceptable only while all server entry points keep strict authorization checks.
- There are no migrations for this development project by instruction, but production will need ordered migrations and rollback strategy.
- Some UI flows still use modal-based edit/view experiences for quotes and invoices; large editing flows should continue moving to pages.

## Security Review

Current protections:

- Clerk is used for app authentication.
- Admin-only server actions call `requireAdmin`.
- Customer document access is checked by customer ownership.
- Supabase RLS is enabled as a restrictive baseline, while server actions use the service role.
- The environment checker blocks public exposure of Supabase privileged keys.

Before real customers:

- Add structured audit logs for quote/invoice status changes, payments, message sends, and admin user actions.
- Add webhook signature verification and delivery logging for any external email/payment provider callbacks.
- Review all service-role server actions for object-level authorization, not just role-level authorization.
- Add rate limits to contact submission and customer message creation endpoints/actions.
- Add production backup/restore drills for the Supabase database and blob assets.

## UI And Mobile Review

Improved in this pass:

- Project and quote creation no longer use oversized modals.
- Contact content is full-width and easier to read.
- Messaging/contact inner scrollbars now match dashboard kanban styling.
- The kanban assignee dropdown is wide enough for names and emails.

Remaining UI risks:

- Several tables still need dedicated small-screen layouts beyond horizontal compression.
- Some dense admin views need stronger empty/loading/error states.
- Quote/invoice edit flows should be page-based for consistency with create flows.
- Mobile verification should be performed with Playwright screenshots before release.

## Verification

Passed locally on 2026-04-20:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` with the local dev server running on `http://localhost:4567` and test API key support enabled
- `pnpm check:env`

## Production Go/No-Go

No-go for open production. Go for private beta after manually testing the main admin and customer flows with realistic data:

- Customer creation and first login
- Project create/edit with four-section galleries
- Quote create/update/send/accept/reject
- Invoice creation from accepted quote and payment status update
- Messaging notification emails to customer/support
- Contact submission read/archive/delete
- Reports page totals against known fixture data
