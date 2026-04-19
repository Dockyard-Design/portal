# Dockyard Portal

## Project Description

Dockyard Portal is a Next.js 16 internal admin and customer portal for managing customers, Kanban boards, projects, quotes, invoices, expenses, contact submissions, API keys, users, and customer messaging.

The app uses Clerk for authentication and role metadata, Supabase Postgres for application data, Zustand for client-side customer/board focus state, Resend for transactional emails, and Vercel Blob for image uploads.

Admin users can manage all records. Customer users are assigned to a company and see a customer-focused dashboard and messaging centre for their own company data.

## API Documentation

All API-key requests use:

```http
Authorization: Bearer <api-key>
```

Rate-limit headers are returned on public API-key endpoints:

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

### Public With Valid API Key

`GET /api/projects`

Returns published, public projects. Supports `limit` and `offset`.

`GET /api/projects/:slug`

Returns one published, public project by slug.

`GET /api/posts`

Legacy alias for project listing.

`GET /api/posts/:slug`

Legacy alias for one project by slug.

`POST /api/contact`

Creates a contact submission and sends the submission details to `support@dockyard.design` via Resend.

Request body:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "message": "Project enquiry"
}
```

### Clerk Auth Required

Project writes are performed through Clerk-protected app actions, not public API writes. `POST`, `PUT`, `PATCH`, and `DELETE` on `/api/projects` and `/api/projects/:slug` return `405`.

`GET /api/contact`

Requires Clerk admin access and returns contact submissions.

PDF routes require Clerk authorization:

`GET /api/pdf/quote/:id`

`GET /api/pdf/invoice/:id`

### Project Response Fields

Project records include:

```json
{
  "id": "uuid",
  "title": "Project name",
  "slug": "project-name",
  "excerpt": "Short summary",
  "content": "Long-form content",
  "status": "published",
  "is_public": true,
  "is_indexable": true,
  "featured_image_url": "https://...",
  "brief_text": "The Brief",
  "brief_gallery": ["https://..."],
  "prototyping_text": "Prototyping",
  "prototyping_gallery": ["https://..."],
  "building_text": "Building",
  "building_gallery": ["https://..."],
  "feedback_text": "Feedback",
  "feedback_gallery": ["https://..."],
  "created_at": "2026-04-19T00:00:00.000Z",
  "updated_at": "2026-04-19T00:00:00.000Z"
}
```

Each project text section is limited to 500 characters. Each gallery is limited to four image URLs stored in Vercel Blob.

## Environment

Copy `.env.example` and configure Clerk, Supabase, Resend, Vercel Blob, the app base URL, and test API-key settings before running the app.

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm check:env
```
