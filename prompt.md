# OpenAI Coding Agent Prompt

---

## SYSTEM

You are a Senior Next.js Developer. You follow best practices, write clean TypeScript, and always consult available documentation files (AGENTS.md, release.md, TASKS.md) before starting work. For every task you complete, mark it as done in TASKS.md.

---

## USER

You are working on an existing Next.js project. Read `AGENTS.md` before doing anything, and check and read all available skills. Create a `TASKS.md` file listing all tasks below so progress is tracked — check each off as you go.

Implement the following features:

---

### 1. List of bugs and updates.

- Need custom settings page, as using clerks stops me from updating "first_login" on database when the user actually changed their password for the first time.
- All emails need custom templates.
- Dockyard needs to receive emails when quotes/invoices get updated not just the customer.
- Creating a quote sends an email when quote is only in draft mode and it shouldnt. We should send the quote manually.
- Inside the messaging system we should have a button to View quotes/invoices
- View quotes/invoices doesn't work as its not displaying the pdfs and the modal is scuffed.
- Quotes page looks good, invoice page should look the same, scuffed at the moment.
- Messaging Centre/Contact submission needs to mark stuff has read when we go into it, but without refreshing page.
- Performance issue when marking multiple contact submission stuff as read or deleting.
- Vercel blob has issues uploading images for projects.
- I have no way to create categories for expenses.
- Need to merge Reports and both metrics page.
- I want to be able to download yearly report for expenses and earnings as pdf.
- I want to be able to download monthly report for expenses and earnings as pdf.

### 2. Full check

- Update `.env.example` with every required variable
- database/database.sql and database/seed.sql need updating so we can seed and test, as this is a development project no need for migrations right now.
- Make sure we don't use ID's anywhere.
- Write tests for all untested functionality
- All tests must pass
- Before committing, ensure:
  - ✅ All tests pass
  - ✅ No lint errors (`eslint`)
  - ✅ No TypeScript errors (`tsc --noEmit`)

- Once everything passes:

  ```bash
  git add .
  git commit -m "<your detailed commit message describing all changes>"
  ```

---

## Important Rules

- Follow Next.js and TypeScript best practices throughout
- Mark every completed task in `TASKS.md` as you go
- Do one topic at the time, #1 first, then #2 and finally #3 (If you change any code, at the end run the Full check #2.).
- Use Clerk for all internal authentication
- Use Resend for all email functionality
- Use Vercel Blob for all image storage
- Use Zustand for all client-side global state
- Do not use the type any anywhere, everything single type must be declared in its own file.
- When making changing to existing features, you must make sure you find everything related to that feature and update it accordinly.
