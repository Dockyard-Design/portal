# OpenAI Coding Agent Prompt

---

## SYSTEM

You are a Senior Next.js Developer. You follow best practices, write clean TypeScript, and always consult available documentation files (AGENTS.md, release.md, TASKS.md) before starting work. For every task you complete, mark it as done in TASKS.md.

---

## USER

You are working on an existing Next.js project. Read `AGENTS.md` before doing anything, and check and read all available skills. Create a `TASKS.md` file listing all tasks below so progress is tracked — check each off as you go.

Implement the following features:

---

### 1. Customer facing Dashboard

- Full width view only kanban board, so customers can track their projects, ability to select each kanban board they want to view, use the default one by default. remove the 3 cards regarding tasks, make sure everything has a header lie on admin dashboard.

### 2. Quotes (customer view and admin view)

- Quotes 3 dots menu needs widening.
- Quotes status filter show all lwoer case instead of actual dropdown names.
- Search bar placeholder should state Search by reference or quote and name (make sure its functional as well)
- Creating a new quote live summary doesnt work.
- For customer view, the 3 dots menu should have 3 buttons only, View, Accept, Reject.
- For customer view, clicking view button should pop a modal with the pdf embeded and option to download.

### 2. Invoices (customer view and admin view)

- Need redesigning to match exactly the quotes pages. These pages should look exactly the same but with invoice data instead isnt it ?
- All above problems for quotes apply here too.
- For customer view, the 3 dots menu should have 3 buttons only, View, Pay.
- For customer view, clicking view button should pop a modal with the pdf embeded and option to download.

### 3. Dashboard

- Move Agency Metrics, Expense Metrics into their own pages. Under Dockyard, create a new menu with these 2 sub menued.
- When having a customer selected hide all the other metrics, focus just on having customer focused metrics in as much detail as possible.
- Make sure Agency Metrics and Expense Metrics pages have as much detail as possible.

### 4. Sidebar

- Same as messaging centre, add buble for unread contact form submissions.
- When we have a customer selected we see their id, can you make sure it shows their company name instead.
- If no customer selected, just have the "Customers" button not be a dropdown but a link to all customers page.

### 5. Kanban

- Creating a task should NOT be required to have a due date.

### 6. Messaging Centre

- on top of mssages should show user first name and last name, Dockyard. for customer just display company name as it is.

### 7. User management and Customer Creation

- Creating a new customer should ask for First Name, Last Name, Phone Number, Email, Company Name, Notes.
- When creating a new customer, automatically create their user account. Send an email with an auto generated password.
- Track when the user logs in for the first time, and prompt a password change immeadiatly.

### 8. Other

- On /dashboard/customers when clicking details on a customer should automatically select that customer on the sidebar too.
- /dashboard/projects should take full width of page

### 9. Contact Form Submissions

- Full redesign, make it look like an email. Look at shadcn. Like gmail like.

### 10. File Management

- For all the views we have, we need to make it more manageabable to work. So I want you to create seperate files for customer views and admin views, then in the files we have name just render based on condition (if this is not a best practice, then find the best practice possible and implement it.)

### 11. Final

- Update `.env.example` with every required variable
- database/database.sql and database/seed.sql need updating, as this is a development project no need for migrations right now.
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

- Mark every completed task in `TASKS.md` as you go
- Follow Next.js and TypeScript best practices throughout
- Use Clerk for all internal authentication
- Use Resend for all email functionality
- Use Vercel Blob for all image storage
- Use Zustand for all client-side global state
- Do not use the type any anywhere, everything single type must be declared in its own file.
- When making changing to existing features, you must make sure you find everything related to that feature and update it accordinly.
