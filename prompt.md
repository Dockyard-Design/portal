# OpenAI Coding Agent Prompt

---

## SYSTEM

You are a Senior Next.js Developer. You follow best practices, write clean TypeScript, and always consult available documentation files (AGENTS.md, release.md, TASKS.md) before starting work. For every task you complete, mark it as done in TASKS.md.

---

## USER

You are working on an existing Next.js project. Read `AGENTS.md` before doing anything, and check and read all available skills. Create a `TASKS.md` file listing all tasks below so progress is tracked — check each off as you go.

Implement the following features:

---

### 1. Customer Selection

- Add a customer dropdown to the sidebar, just below the logo
- Persist selected customer in Zustand store with the ability to clear the selection
- When a customer is selected, enable sidebar sub-menus:
  - **Kanban**: list that customer's boards
  - **Customer Management**: link to the customer's detail page

### 2. Form Submission Emails (Resend)

- On any form submission, send an email to `support@dockyard.design` with all submitted details using Resend

### 3. Quote & Invoice Email (Resend)

- Add a button to send a quote or invoice directly to the customer
- Send from `support@dockyard.design` using Resend

### 4. Vercel Blob Image Storage

- Enable and configure Vercel Blob for all image uploads throughout the app

### 5. Projects API — Extended

- Add 4 text sections to projects: **The Brief**, **Prototyping**, **Building**, **Feedback**
  - Each section: max 500 characters of text
  - Each section: its own image gallery (max 4 images, stored in Vercel Blob)
- Add a **featured image** field (stored in Vercel Blob)
- Move Create/Edit project UI to a **modal** (not a separate page)
- Projects API must be **publicly readable** with a valid API key, but all write operations require Clerk authentication from within the app

### 6. Customer-Focused Dashboard

- When a customer is selected, the dashboard becomes fully focused on that customer
- Display: Quotes metrics, Invoices metrics, Kanban metrics (urgent items, due dates, overdue, etc.)
- Design it to be an exceptional, actionable internal dashboard

### 7. User Roles

- Add two roles: **Admin** and **Customer**
- When creating a user, prompt for role selection
- If Customer: assign them to a company
- Customer users only access a **Customer Dashboard** showing their own data

### 8. Messaging Centre

- Customers can create message threads; admins can view all threads
- Admins can initiate conversations with any customer
- Each new thread triggers an **auto-reply** informing the customer to allow 24 hours for a response
- Include all standard messaging centre features: read/unread state, timestamps, notifications, thread management
- Add Messaging Centre to Customer role permissions

### 9. Contacts API

- Contacts API must be **publicly POST-able** with a valid API key
- All other operations require Clerk authentication from within the app

### 10. Finish release.md Tasks

- Read `release.md` and complete everything listed there

### 11. README.md

- Completely rewrite `README.md` — keep it concise but detailed
- Structure: **Project Name**, **Project Description**, **API Documentation** (endpoints, auth, public vs private access)

### 12. Environment Variables

- Update `.env.example` with every required variable

### 13. Tests

- Write tests for all untested functionality
- All tests must pass

### 14. Final Checks

Before committing, ensure:

- ✅ All tests pass
- ✅ No lint errors (`eslint`)
- ✅ No TypeScript errors (`tsc --noEmit`)

### 15. Git Commit

Once everything passes:

```bash
git add .
git commit -m "<your detailed commit message describing all changes>"
```

---

## Important Rules

- Mark every completed task in `TASKS.md` as you go
- Follow Next.js and TypeScript best practices throughout
- Use Clerk for all internal authentication
- Use Resend for all email functionality
- Use Vercel Blob for all image storage
- Use Zustand for all client-side global state
- Do not use the type any anywhere, everything single type must be declared in its own file.
