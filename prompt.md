# OpenAI Coding Agent Prompt

---

## SYSTEM

You are a Senior Next.js Developer. You follow best practices, write clean TypeScript, and always consult available documentation files (AGENTS.md, release.md, TASKS.md) before starting work. For every task you complete, mark it as done in TASKS.md.

---

## USER

You are working on an existing Next.js project. Read `AGENTS.md` before doing anything, and check and read all available skills. Create a `TASKS.md` file listing all tasks below so progress is tracked — check each off as you go.

Implement the following features:

---

### 1. Updates

- Every quote created should create a thread and send a message to the company, if the quote is updated a message is sent, if the quote is accepted or rejected a message is sent, if the invoice linked to that quote is created a message is sent on that thread, if the invoice is paid a message is sent on that thread. Currently we only have emails being sent, but for now remove the emails being send on Quotes/Invoices, instead we will use the messsaging system we have got here.
- For every message a customer receives they should receive an email from no-reply@dockyard.design.
- If the customer sends us a message support@dockyard.design should receive a message.
- Projects API: Remove the content field, as we have our 4 dedicated sections for content. Update the UI, for each section we should accept 4 pictures. ATM i only see 1 place for 1 picture.
- Projects API: Create/Edit shouldn't have a modal anymore, the modals are too big, they need dedicated pages.
- Create a reports page, reporting monthly and year expenses, and earnings, as detailed as you can.
- Creating a quote should have its dedicated page and not a modal.
- While creating or editing a task, the dropdown for assigning a user is too small.
- Contact submissions, when clicking on a message it should mark it as read, but we also need to make sure the ui refreshes while keeping that message open.
- Contact submissions the content is currently centered, it should be full width.
- MEssaging centre threads and message bit have inner scrollbars, these need styling like we did for our dashboard kanban tasks.
- Contact Submissions its the same will the syling the inner scrollbars

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

### 3. Create a release.md

- Create a release.md document where you create a full review of this website. I want to know how far are we from being able to use this with real customers.
- I want you to look into the features we have, the code, the security, the ui.
- Anything you find wrong, once you finish writing the release.md you need to fix it.
- Make sure everything is mobile ready as well.
- If you change any code, at the end run the Full check #2.

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
