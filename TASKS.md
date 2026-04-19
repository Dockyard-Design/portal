# Implementation Tasks

## 1. Customer Selection

- [x] Add a customer dropdown to the sidebar, just below the logo.
- [x] Persist selected customer in Zustand store with the ability to clear the selection.
- [x] When a customer is selected, enable Kanban submenu with that customer's boards.
- [x] When a customer is selected, enable Customer Management link to the customer's detail page.

## 2. Form Submission Emails (Resend)

- [x] On any form submission, send an email to support@dockyard.design with all submitted details using Resend.

## 3. Quote & Invoice Email (Resend)

- [x] Add a button to send a quote directly to the customer.
- [x] Add a button to send an invoice directly to the customer.
- [x] Send quote and invoice emails from support@dockyard.design using Resend.

## 4. Vercel Blob Image Storage

- [x] Enable and configure Vercel Blob for all image uploads throughout the app.

## 5. Projects API Extended

- [x] Add The Brief text section to projects, max 500 characters.
- [x] Add Prototyping text section to projects, max 500 characters.
- [x] Add Building text section to projects, max 500 characters.
- [x] Add Feedback text section to projects, max 500 characters.
- [x] Add an image gallery for each section, max 4 Vercel Blob images each.
- [x] Add a featured image field stored in Vercel Blob.
- [x] Move Create/Edit project UI to a modal.
- [x] Make Projects API publicly readable with a valid API key.
- [x] Require Clerk authentication for all Projects API write operations from within the app.

## 6. Customer-Focused Dashboard

- [x] Focus the dashboard on the selected customer when present.
- [x] Display customer quote metrics.
- [x] Display customer invoice metrics.
- [x] Display customer Kanban metrics including urgent, due, and overdue items.
- [x] Refine the dashboard into an actionable internal view.

## 7. User Roles

- [x] Add Admin and Customer roles.
- [x] Prompt for role selection when creating a user.
- [x] Assign Customer users to a company.
- [x] Restrict Customer users to a Customer Dashboard showing their own data.

## 8. Messaging Centre

- [x] Allow customers to create message threads.
- [x] Allow admins to view all message threads.
- [x] Allow admins to initiate conversations with any customer.
- [x] Send an auto-reply on each new thread asking customers to allow 24 hours for a response.
- [x] Add read/unread state.
- [x] Add timestamps.
- [x] Add notifications.
- [x] Add thread management.
- [x] Add Messaging Centre to Customer role permissions.

## 9. Contacts API

- [x] Make Contacts API publicly POST-able with a valid API key.
- [x] Require Clerk authentication for all other Contacts API operations from within the app.

## 10. Finish release.md Tasks

- [x] Add Supabase policies that match the app access model.
- [ ] Verify RLS with Supabase advisors or equivalent SQL checks against the real project.
- [x] Replace destructive reset SQL with ordered migrations before production deployment.
- [x] Keep database/database.sql usable for local reset only, or rename/document it clearly.
- [x] Add tests for invoice creation and invoice numbering.
- [x] Add tests for kanban drag/drop persistence.
- [x] Add regression coverage for contact submission admin actions.

## 11. README.md

- [x] Rewrite README.md with Project Name, Project Description, and API Documentation.

## 12. Environment Variables

- [x] Update .env.example with every required variable.

## 13. Tests

- [x] Write tests for all untested functionality.
- [x] Ensure all tests pass.

## 14. Final Checks

- [x] Run pnpm lint.
- [x] Run pnpm typecheck.
- [x] Run pnpm test.
- [x] Run pnpm check:env.

## 15. Git Commit

- [x] Commit all changes with a detailed message.

## 16. Regression Fixes

- [x] Restore always-visible Kanban and All Customers sidebar links.
- [x] Remove duplicate Messaging Centre link from customer-specific sidebar section.
- [x] Show Customer Details only when a customer is selected.
- [x] Replace bugged sidebar customer select so selected customers display by name, not ID.
- [x] Refresh customer list/sidebar after creating a customer.
- [x] Allow editing user role and assigned company.
- [x] Fix duplicate sidebar keys for customer board links.
