# Implementation Tasks

## 1. Updates

- [x] Replace quote/invoice email notifications with messaging threads and thread messages.
- [x] Email customers from `no-reply@dockyard.design` for every received message.
- [x] Email `support@dockyard.design` when a customer sends a message.
- [x] Projects API: remove the `content` field and support four pictures per dedicated project section.
- [x] Projects UI: move create/edit from modals to dedicated pages and expose four pictures per section.
- [x] Reports: create a monthly/yearly expenses and earnings page.
- [x] Quotes: move quote creation from modal to a dedicated page.
- [x] Kanban tasks: make the user assignment dropdown large enough while creating or editing.
- [x] Contact submissions: mark messages read on click and refresh the UI while keeping the message open.
- [x] Contact submissions: make message content full width.
- [x] Messaging centre: style inner scrollbars like dashboard kanban tasks.
- [x] Contact submissions: style inner scrollbars like dashboard kanban tasks.

## 2. Full Check

- [x] Update `.env.example` with every required variable.
- [x] Update `database/database.sql` and `database/seed.sql` for seedable development testing.
- [ ] Remove user-visible raw IDs where they are displayed.
- [ ] Write tests for newly covered functionality.
- [x] Run all tests.
- [x] Run ESLint.
- [x] Run TypeScript checks.
- [x] Commit all changes.

## 3. Release Review

- [x] Create `release.md` with a full website readiness review.
- [x] Review features, code, security, UI, and mobile readiness.
- [x] Fix issues found during the release review.
- [x] Re-run the full check after any code changes.
