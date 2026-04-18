# Dockyard Portal

A multi-user content management portal with API key authentication, contact form handling, and comprehensive project management.

---

## Overview

Dockyard Portal provides:

1. **Dashboard** - Overview of projects, contact submissions, API keys, and analytics
2. **Projects** - Full CRUD management with SEO optimization, drafts, and publishing workflow
3. **Contact** - Contact form submissions with status tracking and archiving
4. **API Keys** - Management of external access keys with usage tracking
5. **Public API** - Read-only access to published content and contact form submissions

**Base URL:** `http://localhost:4567` (development) / Your production domain

---

## Features

### Dashboard
- Statistics overview (Projects, Contact, API Keys, Requests)
- Recent projects list
- API health metrics
- Recent API requests with detailed modal view

### Projects
- Create, edit, delete projects
- SEO fields (title, description, keywords)
- Publishing workflow (draft → published → archived)
- Visibility controls (public/private, indexable)
- Author tracking via Clerk integration
- Featured image support

### Contact Management
- Four status stages: New → Read → Replied → Closed
- Bulk actions (mark status, archive, delete)
- Archive/unarchive functionality
- Multiselect with select-all
- AlertDialog confirmations for all destructive actions

### API Keys
- Create and revoke keys
- Usage tracking (request count, last used)
- Prefix display for identification
- Copy-to-clipboard functionality

---

## Authentication

### Portal Access (Clerk)

The portal uses Clerk for authentication:
- Users sign in with email/password or SSO
- Any authenticated user can manage all content (multi-user portal)
- User avatars and account management in sidebar

### API Key Authentication (External Access)

All API requests require authentication via Bearer token in the Authorization header.

```http
Authorization: Bearer sk_live_your_api_key_here
```

To obtain an API key:

1. Sign in to the Dockyard Portal dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create New Key"
4. Copy the full key (starts with `sk_live_`)

**Important:** Store your API key securely. It is only shown once at creation time.

### Clerk Session Authentication

For browser-based requests from authenticated users, the API automatically detects Clerk sessions via cookies. No explicit Authorization header is required if the user is signed in via Clerk.

---

## Rate Limiting

All API endpoints are rate limited per identifier:

- **Limit:** 100 requests per minute per API key
- **Window:** 60-second sliding window
- **Headers:** Every response includes rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the window resets

---

## API Endpoints

### Posts API

**Note:** The external API uses `/api/posts` for public consumption, though the portal internally refers to these as "Projects."

#### List All Posts

```http
GET /api/posts?limit={limit}&offset={offset}
Authorization: Bearer sk_live_your_api_key
```

**Query Parameters:**

| Parameter | Type    | Default | Max | Description                              |
| --------- | ------- | ------- | --- | ---------------------------------------- |
| `limit`   | integer | 50      | 100 | Number of posts to return                |
| `offset`  | integer | 0       | -   | Number of posts to skip (for pagination) |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Short excerpt...",
      "status": "published",
      "is_public": true,
      "seo_title": "SEO Title",
      "seo_description": "SEO Description",
      "seo_keywords": "keyword1, keyword2",
      "featured_image_url": "https://...",
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Notes:**

- List endpoint does NOT include full `content` field (use single post endpoint for that)
- Only returns `published` && `public` posts for API key users
- Authenticated Clerk users can see their own drafts/private posts
- Results are sorted by `updated_at` descending (most recent first)

**Pagination Example:**

```javascript
// Get first page (posts 1-10)
const page1 = await fetch("/api/posts?limit=10&offset=0");

// Get second page (posts 11-20)
const page2 = await fetch("/api/posts?limit=10&offset=10");

// Get third page (posts 21-30)
const page3 = await fetch("/api/posts?limit=10&offset=20");
```

#### Get Single Post

```http
GET /api/posts/:slug
Authorization: Bearer sk_live_your_api_key
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-slug",
    "content": "Full markdown content...",
    "excerpt": "Short excerpt...",
    "status": "published",
    "is_public": true,
    "is_indexable": true,
    "seo_title": "SEO Title",
    "seo_description": "SEO Description",
    "seo_keywords": "keyword1, keyword2",
    "featured_image_url": "https://...",
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": "Post not found"
}
```

#### Error Responses

| Status | Description                                                            |
| ------ | ---------------------------------------------------------------------- |
| 401    | Unauthorized - Invalid or missing API key                              |
| 404    | Post not found                                                         |
| 405    | Method Not Allowed - POST/PUT/PATCH/DELETE not allowed (read-only API) |
| 429    | Rate limit exceeded                                                    |

---

### Contact Form API

#### Submit Contact Form

```http
POST /api/contact
Authorization: Bearer sk_live_your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I have a question about your services..."
}
```

**Validation Rules:**

- `name`: Required, non-empty string
- `email`: Required, valid email format
- `message`: Required, non-empty string (any length)

**Response (201 Created):**

```json
{
  "message": "Submission received successfully"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": {
    "email": { "_errors": ["Invalid email"] },
    "name": { "_errors": ["Required"] }
  }
}
```

#### Get Contact Submissions (Dashboard Only)

This endpoint requires authentication and is available through the dashboard UI, not the public API.

---

## Contact Submission Status Workflow

Contact submissions have the following lifecycle:

### Statuses

- **new** - Just received, not yet viewed
- **read** - Has been viewed
- **replied** - A response has been sent
- **closed** - No further action needed (also triggers archiving)

### Archiving

- Archived submissions are hidden from main tables but preserved
- Archiving automatically sets status to "closed"
- Unarchiving restores to previous workflow
- Bulk archive/unarchive actions available

---

## Error Reference

### Common Error Codes

| HTTP Status | Code                  | Description                    | Resolution                                    |
| ----------- | --------------------- | ------------------------------ | --------------------------------------------- |
| 400         | `validation_failed`   | Request body validation failed | Check the `details` field for specific errors |
| 401         | `unauthorized`        | Missing or invalid API key     | Verify your Authorization header format       |
| 404         | `not_found`           | Resource does not exist        | Check the identifier/slug                     |
| 405         | `method_not_allowed`  | HTTP method not supported      | Use GET for posts, POST for contact           |
| 429         | `rate_limit_exceeded` | Too many requests              | Wait for the reset time in headers            |
| 500         | `internal_error`      | Server error                   | Contact admin if persistent                   |

### Rate Limit Response

When rate limited (429):

```json
{
  "error": "Too many requests. Please try again later."
}
```

The response includes a `Retry-After` header with seconds to wait.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class DockyardApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async fetch(path: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // Log rate limit info
    console.log(
      "Rate limit remaining:",
      response.headers.get("X-RateLimit-Remaining"),
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(`API Error ${response.status}: ${error.error}`);
    }

    return response.json();
  }

  // Posts with pagination support
  async listPosts(options?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const queryString = params.toString();
    return this.fetch(`/api/posts${queryString ? `?${queryString}` : ""}`);
  }

  // Get all posts with automatic pagination
  async listAllPosts(batchSize: number = 50): Promise<any[]> {
    const allPosts: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listPosts({ limit: batchSize, offset });
      const posts = response.data || [];

      if (posts.length === 0) break;

      allPosts.push(...posts);
      offset += batchSize;
      hasMore = posts.length === batchSize;
    }

    return allPosts;
  }

  async getPost(slug: string) {
    return this.fetch(`/api/posts/${slug}`);
  }

  // Contact
  async submitContact(name: string, email: string, message: string) {
    return this.fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    });
  }
}

// Usage
const client = new DockyardApiClient(
  "http://localhost:4567",
  "sk_live_your_key",
);

// Get first 10 posts
const posts = await client.listPosts({ limit: 10, offset: 0 });
console.log(posts.data);

// Get next 10 posts
const nextPage = await client.listPosts({ limit: 10, offset: 10 });
console.log(nextPage.data);

// Get all posts (auto-pagination)
const allPosts = await client.listAllPosts(50);
console.log(`Total posts: ${allPosts.length}`);

// Get single post
const post = await client.getPost("my-post-slug");
console.log(post.data.content);

// Submit contact form
await client.submitContact("John Doe", "john@example.com", "Hello!");
```

### Python

```python
import requests
from typing import Optional

class DockyardApiClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.base_url}{path}"
        response = self.session.request(method, url, **kwargs)

        # Log rate limit info
        print(f"Rate limit remaining: {response.headers.get('X-RateLimit-Remaining')}")

        response.raise_for_status()
        return response.json()

    def list_posts(self) -> dict:
        """Get all published posts."""
        return self._request('GET', '/api/posts')

    def get_post(self, slug: str) -> dict:
        """Get a single post by slug."""
        return self._request('GET', f'/api/posts/{slug}')

    def submit_contact(self, name: str, email: str, message: str) -> dict:
        """Submit a contact form."""
        return self._request('POST', '/api/contact', json={
            'name': name,
            'email': email,
            'message': message
        })

# Usage
client = DockyardApiClient('http://localhost:4567', 'sk_live_your_key')

# Get all posts
posts = client.list_posts()
for post in posts['data']:
    print(post['title'])

# Get single post
post = client.get_post('my-post-slug')
print(post['data']['content'])

# Submit contact form
client.submit_contact('John Doe', 'john@example.com', 'Hello!')
```

### cURL

```bash
# Set your API key
API_KEY="sk_live_your_api_key"
BASE_URL="http://localhost:4567"

# List all posts (default: 50, max: 100)
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/posts"

# List with pagination - first 10 posts
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/posts?limit=10&offset=0"

# Get next page (posts 11-20)
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/posts?limit=10&offset=10"

# Get specific page (posts 21-30)
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/posts?limit=10&offset=20"

# Get single post
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/posts/my-post-slug"

# Submit contact form
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","message":"Hello!"}' \
  "$BASE_URL/api/contact"
```

---

## Data Types Reference

### Post Object

| Field               | Type                                  | Description                              |
| ------------------- | ------------------------------------- | ---------------------------------------- |
| `id`                | string (uuid)                         | Unique identifier                        |
| `title`             | string                                | Post title                               |
| `slug`              | string                                | URL-friendly identifier                  |
| `content`           | string                                | Full markdown content (single post only) |
| `excerpt`           | string                                | Short preview text                       |
| `status`            | "published" \| "draft" \| "archived" | Publication status                       |
| `is_public`         | boolean                               | Visibility flag                          |
| `is_indexable`      | boolean                               | Search engine indexing flag              |
| `seo_title`         | string                                | SEO meta title                           |
| `seo_description`   | string                                | SEO meta description                     |
| `seo_keywords`      | string                                | Comma-separated keywords                 |
| `featured_image_url`| string                                | Cover image URL                          |
| `created_at`        | string (ISO 8601)                     | Creation date                            |
| `updated_at`        | string (ISO 8601)                     | Last update date                         |

### Contact Submission Object

| Field        | Type                                     | Description       |
| ------------ | ---------------------------------------- | ----------------- |
| `id`         | string (uuid)                            | Unique identifier |
| `name`       | string                                   | Submitter's name  |
| `email`      | string                                   | Submitter's email |
| `message`    | string                                   | Message content   |
| `status`     | "new" \| "read" \| "replied" \| "closed" | Workflow status   |
| `archived`   | boolean                                  | Archived flag     |
| `created_at` | string (ISO 8601)                        | Submission date   |
| `updated_at` | string (ISO 8601)                        | Last update date  |

---

## Security Notes

1. **Never expose your API key in client-side code** (browsers, mobile apps)
2. **Use environment variables** for API keys in server applications
3. **Rotate keys periodically** via the dashboard
4. **Revoke compromised keys** immediately
5. The API is **read-only for posts** - only POST to `/api/contact` is allowed for write operations
6. All users in the portal can manage all content (multi-user collaboration model)

---

## Changelog

### v1.1.0

- Added pagination support (`limit` and `offset` parameters)
- Maximum 100 items per request
- Automatic pagination helper in SDKs
- Author display in projects table
- UI/UX improvements with AlertDialog confirmations

### v1.0.0

- Initial API release
- Posts endpoint with list and single view
- Contact form submission endpoint
- API key authentication
- Rate limiting

---
