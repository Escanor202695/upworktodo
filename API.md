# API Documentation

Complete API reference for the Todo Web App.

## Base URL

```
http://localhost:3000/api
```

For production: `https://your-domain.com/api`

## Authentication

All API endpoints require authentication via NextAuth session cookies. Requests without a valid session will receive a `401 Unauthorized` response.

### How Authentication Works

1. User signs in via Google OAuth at `/auth/signin`
2. NextAuth creates a session stored in the database
3. Session token is stored in an HTTP-only cookie
4. Subsequent requests include this cookie automatically
5. Server validates the session on each request

### Authentication Headers

No special headers needed - authentication is handled via cookies set by NextAuth.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Standard HTTP Status Codes

- `200 OK` - Successful GET/PATCH request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

## Endpoints

### 1. List Tasks

Retrieves a paginated list of the authenticated user's tasks with optional search.

**Endpoint:**
```http
GET /api/tasks
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | - | Case-insensitive search on task title |
| `page` | integer | No | 1 | Page number (minimum: 1) |
| `pageSize` | integer | No | 10 | Items per page (minimum: 1, maximum: 100) |

**Examples:**

```bash
# Get first page of tasks
GET /api/tasks

# Get second page with 20 items per page
GET /api/tasks?page=2&pageSize=20

# Search for tasks containing "grocery"
GET /api/tasks?q=grocery

# Combined: search with pagination
GET /api/tasks?q=work&page=1&pageSize=5
```

**Success Response (200 OK):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "title": "Buy groceries",
      "done": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "userId": "clx0987654321"
    },
    {
      "id": "clx1234567891",
      "title": "Finish project",
      "done": true,
      "createdAt": "2024-01-14T15:20:00.000Z",
      "userId": "clx0987654321"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 25,
  "totalPages": 3
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | Array<Task> | Array of task objects |
| `page` | integer | Current page number |
| `pageSize` | integer | Number of items per page |
| `total` | integer | Total number of matching tasks |
| `totalPages` | integer | Total number of pages |

**Task Object:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task identifier (cuid) |
| `title` | string | Task title |
| `done` | boolean | Completion status |
| `createdAt` | string | ISO 8601 timestamp |
| `userId` | string | ID of task owner |

**Error Responses:**

- `401 Unauthorized` - User is not authenticated

**Notes:**

- Tasks are ordered by `createdAt` in descending order (newest first)
- Search is case-insensitive and uses `LIKE '%query%'` pattern
- Only returns tasks belonging to the authenticated user
- `pageSize` is automatically capped at 100 if a larger value is provided
- `page` is automatically set to 1 if a value less than 1 is provided

---

### 2. Create Task

Creates a new task for the authenticated user.

**Endpoint:**
```http
POST /api/tasks
```

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Task title here"
}
```

**Body Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `title` | string | Yes | 1-200 chars, non-empty | The task title |

**Examples:**

```bash
# Create a simple task
POST /api/tasks
Content-Type: application/json

{
  "title": "Buy milk"
}

# Create a task with longer title
POST /api/tasks
Content-Type: application/json

{
  "title": "Research and compare different task management tools for the team"
}
```

**Success Response (201 Created):**

```json
{
  "id": "clx1234567892",
  "title": "Buy milk",
  "done": false,
  "createdAt": "2024-01-15T11:00:00.000Z",
  "userId": "clx0987654321"
}
```

**Error Responses:**

**400 Bad Request** - Title is missing:
```json
{
  "error": "Title is required"
}
```

**400 Bad Request** - Title is empty or only whitespace:
```json
{
  "error": "Title cannot be empty"
}
```

**400 Bad Request** - Title exceeds 200 characters:
```json
{
  "error": "Title must be between 1 and 200 characters"
}
```

**401 Unauthorized** - User is not authenticated:
```json
{
  "error": "Unauthorized"
}
```

**Notes:**

- Title is automatically trimmed of leading/trailing whitespace
- Empty strings are rejected even if they're just spaces
- The `done` field is automatically set to `false`
- The `userId` is automatically set from the authenticated session
- The `createdAt` timestamp is automatically set to the current time

---

### 3. Toggle Task Done Status

Toggles the completion status of a task (from `done: false` to `done: true` or vice versa).

**Endpoint:**
```http
PATCH /api/tasks/:id/toggle
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The task ID (cuid format) |

**Request Body:**

None required - the endpoint simply toggles the current state.

**Examples:**

```bash
# Toggle task status
PATCH /api/tasks/clx1234567890/toggle

# Multiple toggles (first call marks done, second marks not done)
PATCH /api/tasks/clx1234567890/toggle  # done: false -> true
PATCH /api/tasks/clx1234567890/toggle  # done: true -> false
```

**Success Response (200 OK):**

```json
{
  "id": "clx1234567890",
  "title": "Buy groceries",
  "done": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "userId": "clx0987654321"
}
```

**Error Responses:**

**401 Unauthorized** - User is not authenticated:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - Task belongs to another user:
```json
{
  "error": "Forbidden: You can only modify your own tasks"
}
```

**404 Not Found** - Task doesn't exist:
```json
{
  "error": "Task not found"
}
```

**Notes:**

- Endpoint verifies task ownership before allowing modification
- Returns the updated task object with the new `done` value
- Cannot modify tasks belonging to other users (data isolation)
- Idempotent operation - calling twice returns to original state

---

## Data Isolation & Security

### Per-User Data Isolation

The API enforces strict data isolation:

1. **List endpoint** - Only returns tasks where `userId` matches the authenticated user
2. **Create endpoint** - Automatically sets `userId` to the authenticated user
3. **Toggle endpoint** - Verifies task ownership before allowing modification

This ensures users cannot:
- View other users' tasks
- Modify other users' tasks
- Create tasks for other users

### Implementation

```typescript
// Example: How ownership is verified
const task = await prisma.task.findUnique({ where: { id } })

if (task.userId !== session.user.id) {
  return NextResponse.json(
    { error: 'Forbidden: You can only modify your own tasks' },
    { status: 403 }
  )
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding:

- Rate limiting per user
- Request throttling
- IP-based restrictions

## CORS

The API is configured for same-origin requests only. To enable CORS for external clients, update `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH' },
        ],
      },
    ]
  },
}
```

## Testing the API

### Using curl

```bash
# Note: You'll need to include session cookies
# It's easier to test through the UI or use a tool like Postman

# List tasks (after authenticating in browser)
curl http://localhost:3000/api/tasks \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"title":"Test task from curl"}'

# Toggle task
curl -X PATCH http://localhost:3000/api/tasks/TASK_ID/toggle \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Using Postman

1. Sign in through the web UI first
2. Get your session cookie from browser DevTools
3. In Postman, add the cookie to your requests
4. Make API calls

### Using the UI

The web interface at `http://localhost:3000` provides a user-friendly way to interact with all API endpoints.

## Examples with Response

### Complete Workflow Example

```bash
# 1. User signs in (handled by UI)
# Session cookie is set automatically

# 2. Create first task
POST /api/tasks
{
  "title": "Learn Next.js"
}
# Response: { id: "abc", title: "Learn Next.js", done: false, ... }

# 3. Create second task
POST /api/tasks
{
  "title": "Build todo app"
}
# Response: { id: "def", title: "Build todo app", done: false, ... }

# 4. List all tasks
GET /api/tasks
# Response: { items: [task1, task2], page: 1, pageSize: 10, total: 2, totalPages: 1 }

# 5. Complete first task
PATCH /api/tasks/abc/toggle
# Response: { id: "abc", title: "Learn Next.js", done: true, ... }

# 6. Search for tasks
GET /api/tasks?q=next
# Response: { items: [task1], page: 1, pageSize: 10, total: 1, totalPages: 1 }
```

## Changelog

### v1.0.0 (Initial Release)
- GET /api/tasks - List and search tasks with pagination
- POST /api/tasks - Create new tasks
- PATCH /api/tasks/:id/toggle - Toggle task completion

## Support

For issues or questions about the API:
1. Check this documentation
2. Review the source code in `app/api/tasks/`
3. Check the README.md for setup instructions
