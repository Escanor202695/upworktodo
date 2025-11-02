# Architecture Documentation

## Overview

This document describes the architecture, design decisions, and technical implementation of the Todo web application.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  ┌────────────────────────────────────────────┐    │
│  │         React Components (Next.js)          │    │
│  │  - Authentication UI                        │    │
│  │  - Task List                                │    │
│  │  - Task Creation Form                       │    │
│  │  - Search & Pagination                      │    │
│  └────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/HTTPS
                        │
┌───────────────────────▼─────────────────────────────┐
│              Next.js App Router (Server)             │
│  ┌──────────────────────────────────────────────┐  │
│  │              API Routes                       │  │
│  │  - GET /api/tasks                            │  │
│  │  - POST /api/tasks                           │  │
│  │  - PATCH /api/tasks/:id/toggle               │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │           NextAuth.js                         │  │
│  │  - Google OAuth Flow                         │  │
│  │  - Session Management                        │  │
│  │  - Authentication Middleware                 │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │            Prisma ORM                        │  │
│  │  - Query Builder                             │  │
│  │  - Type Safety                               │  │
│  │  - Database Migrations                       │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ SQL
                        │
┌───────────────────────▼─────────────────────────────┐
│                  PostgreSQL Database                 │
│  ┌──────────────────────────────────────────────┐  │
│  │  Tables:                                      │  │
│  │  - User                                       │  │
│  │  - Account (OAuth)                            │  │
│  │  - Session                                    │  │
│  │  - Task                                       │  │
│  │  - VerificationToken                          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

**Next.js 14 (App Router)**
- **Why**: Latest Next.js with improved performance and developer experience
- **Features Used**:
  - Server Components for initial page loads
  - Client Components for interactivity
  - API Routes for backend logic
  - Built-in optimization (Image, Font, etc.)

**React 18**
- **Why**: Industry standard, excellent ecosystem
- **Features Used**:
  - Hooks (useState, useEffect)
  - Client-side routing
  - Form handling

**Tailwind CSS**
- **Why**: Utility-first, rapid development, small bundle size
- **Benefits**:
  - No CSS file management
  - Responsive design utilities
  - Consistent design system

**TypeScript**
- **Why**: Type safety, better IDE support, fewer runtime errors
- **Benefits**:
  - Catch errors at compile time
  - Better autocomplete
  - Self-documenting code

### Backend

**Next.js API Routes**
- **Why**: Co-located with frontend, simplified deployment
- **Alternative Considered**: NestJS (more overhead for this use case)
- **Benefits**:
  - Same language as frontend
  - Shared types
  - Simpler deployment

**NextAuth.js**
- **Why**: De facto standard for Next.js authentication
- **Features Used**:
  - Google OAuth provider
  - Database sessions
  - Prisma adapter
  - Built-in CSRF protection

**Prisma ORM**
- **Why**: Best-in-class TypeScript ORM
- **Benefits**:
  - Type-safe queries
  - Automatic migrations
  - Excellent DX (Prisma Studio)
  - Prevents SQL injection

**PostgreSQL**
- **Why**: Robust, ACID compliant, feature-rich
- **Alternatives Considered**: 
  - MySQL: Similar, but Postgres has better JSON support
  - MongoDB: Not ideal for relational data
- **Features Used**:
  - Transactions
  - Indexes
  - Foreign keys
  - Full-text search (case-insensitive)

## Design Decisions

### 1. App Router vs Pages Router

**Decision**: Use App Router

**Reasoning**:
- Latest Next.js paradigm
- Better performance with Server Components
- Improved data fetching patterns
- Future-proof choice
- Requirements didn't specify, so chose modern approach

### 2. Database Sessions vs JWT

**Decision**: Database sessions

**Reasoning**:
- More secure (can revoke sessions)
- Easier to manage
- Better for this use case (not distributed system)
- NextAuth recommendation for database-backed apps

### 3. Client-Side vs Server-Side Rendering

**Decision**: Hybrid approach

**Implementation**:
- Sign-in page: Client Component (interactive form)
- Main page: Client Component (real-time updates)
- API Routes: Server-side (security)

**Reasoning**:
- Need client interactivity for forms and state
- Server-side for authentication checks
- Best of both worlds

### 4. Search Implementation

**Decision**: Database-level search with Prisma

**Alternatives Considered**:
- Elasticsearch: Overkill for simple title search
- Client-side filtering: Bad UX with pagination

**Implementation**:
```typescript
where: {
  title: {
    contains: query,
    mode: 'insensitive' // Case-insensitive
  }
}
```

### 5. Pagination Strategy

**Decision**: Offset-based pagination

**Alternatives Considered**:
- Cursor-based: More complex, not needed for this use case
- Client-side: Poor performance with many tasks

**Implementation**:
```typescript
skip: (page - 1) * pageSize,
take: pageSize
```

## Data Model Design

### Task Table

```prisma
model Task {
  id        String   @id @default(cuid())
  title     String
  done      Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([userId, title])
}
```

**Design Decisions**:

1. **`id` as cuid**
   - Collision-resistant
   - Sortable by creation time
   - URL-safe

2. **`userId` foreign key**
   - Enforces referential integrity
   - Enables cascade delete
   - Optimized with index

3. **Composite index on `[userId, title]`**
   - Optimizes filtered searches
   - Single index for common query pattern

4. **`createdAt` timestamp**
   - Audit trail
   - Ordering capability
   - Future features (filtering by date)

5. **`done` boolean with default**
   - Simple state management
   - No null values
   - Clear semantics

### Why Not Add More Fields?

Requirements specified minimal implementation. Could easily add:
- `updatedAt` - Track modifications
- `description` - Longer task details
- `priority` - Task importance
- `dueDate` - Deadlines
- `tags` - Categorization

Kept simple per requirements: "you may extend if needed" implies current fields are sufficient.

## API Design

### RESTful Principles

**Resource-based URLs**:
- `/api/tasks` - Collection
- `/api/tasks/:id` - Individual resource
- `/api/tasks/:id/toggle` - Action on resource

**HTTP Verbs**:
- `GET` - Retrieve
- `POST` - Create
- `PATCH` - Partial update (toggle is a partial update)

**Status Codes**:
- `200` - Success (GET, PATCH)
- `201` - Created (POST)
- `400` - Bad request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not found

### Pagination Response Format

```typescript
{
  items: Task[],        // Actual data
  page: number,         // Current page
  pageSize: number,     // Items per page
  total: number,        // Total items
  totalPages: number    // Total pages
}
```

**Why this format?**
- Standard pattern (similar to many APIs)
- Provides all info needed for UI
- Enables building pagination controls
- Allows pre-fetching next page

## Security Architecture

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirected to Google OAuth consent screen
   ↓
3. User approves
   ↓
4. Google redirects to /api/auth/callback/google with code
   ↓
5. NextAuth exchanges code for tokens
   ↓
6. NextAuth creates user/account records if new
   ↓
7. NextAuth creates session in database
   ↓
8. Session token set in HTTP-only cookie
   ↓
9. User redirected to application
   ↓
10. Subsequent requests include cookie
    ↓
11. Middleware validates session on each request
```

### Data Isolation

**Three-layer approach**:

1. **Middleware Layer**
   - Checks authentication before route access
   - Redirects unauthenticated users

2. **API Layer**
   - Validates session in each endpoint
   - Extracts userId from session

3. **Database Layer**
   - All queries filter by userId
   - Foreign key constraints

**Example**:
```typescript
// Layer 1: Middleware
export default withAuth({ pages: { signIn: '/auth/signin' } })

// Layer 2: API Route
const session = await getServerSession(authOptions)
if (!session?.user?.id) return 401

// Layer 3: Database Query
await prisma.task.findMany({
  where: { userId: session.user.id }
})
```

## Performance Considerations

### Database Optimization

1. **Indexes**
   - `userId` - Fast user filtering
   - `[userId, title]` - Fast search queries

2. **Connection Pooling**
   - Prisma handles automatically
   - Reuses connections

3. **Query Optimization**
   - Single query for count + data would be faster
   - Chose readability over micro-optimization
   - Can optimize if needed:
     ```typescript
     const [items, total] = await prisma.$transaction([
       prisma.task.findMany({ where, skip, take }),
       prisma.task.count({ where })
     ])
     ```

### Frontend Optimization

1. **React Query Potential**
   - Not implemented (requirement scope)
   - Would add caching, optimistic updates
   - Consider for production

2. **Debounced Search**
   - Not implemented (requirement scope)
   - Would reduce API calls
   - Easy to add with useDebounce hook

3. **Pagination Strategy**
   - Offset-based (simple)
   - Cursor-based would be better for large datasets
   - Current approach sufficient for requirements

## Error Handling Strategy

### Client-Side

```typescript
try {
  const response = await fetch('/api/tasks', { method: 'POST', ... })
  if (!response.ok) {
    const error = await response.json()
    setError(error.error)
  }
} catch (err) {
  setError('Failed to create task')
}
```

**Display to User**:
- Non-intrusive error messages
- Clear, actionable text
- Dismissible (new action clears error)

### Server-Side

```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error) // Server logs
  return NextResponse.json(
    { error: 'Generic message' },          // Client response
    { status: 500 }
  )
}
```

**Logging**:
- Detailed errors server-side
- Generic errors to client
- No sensitive data exposure

## Testing Strategy

### What Would Be Tested

1. **Unit Tests** (Jest)
   - Validation functions
   - Utility functions
   - Component logic

2. **Integration Tests** (Jest + Supertest)
   - API endpoints
   - Database operations
   - Authentication flow

3. **E2E Tests** (Playwright/Cypress)
   - User flows
   - Authentication
   - Task CRUD operations

4. **Security Tests**
   - Authorization checks
   - Input validation
   - SQL injection attempts
   - XSS attempts

### Test Coverage Goals

- **Unit**: 80%+
- **Integration**: Key user paths
- **E2E**: Happy paths + critical errors

## Deployment Architecture

### Development

```
localhost:3000 (Next.js dev server)
    ↓
localhost:5432 (Local PostgreSQL)
```

### Production (Example: Vercel)

```
Vercel Edge Network
    ↓
Vercel Functions (API Routes)
    ↓
Managed PostgreSQL (Neon/Heroku/AWS RDS)
```

**Environment Variables**:
- Stored in platform dashboard
- Never committed to version control
- Different values per environment

## Scalability Considerations

### Current Limitations

1. **Database Connection Limits**
   - Prisma connection pooling helps
   - Could hit limits with high traffic

2. **No Caching**
   - Every request hits database
   - Could add Redis for sessions

3. **No CDN**
   - Static assets served from app
   - Could use Vercel/Cloudflare CDN

### How to Scale

1. **Horizontal Scaling**
   - Deploy multiple instances
   - Load balancer in front
   - Vercel handles automatically

2. **Database Scaling**
   - Read replicas for queries
   - Write to primary
   - Connection pooling (PgBouncer)

3. **Caching**
   - Redis for session storage
   - CDN for static assets
   - Client-side caching (React Query)

4. **Rate Limiting**
   - Prevent abuse
   - Protect database
   - Use Vercel limits or custom middleware

## Code Organization

```
app/
├── api/              # API routes (backend)
│   ├── auth/         # Authentication
│   └── tasks/        # Task endpoints
├── auth/             # Auth pages
│   └── signin/       # Sign-in page
├── layout.tsx        # Root layout
├── page.tsx          # Home page (task list)
├── providers.tsx     # Context providers
└── globals.css       # Global styles

lib/
├── auth.ts           # Auth configuration
└── prisma.ts         # Database client

prisma/
└── schema.prisma     # Database schema

types/
└── next-auth.d.ts    # Type extensions
```

**Principles**:
- **Separation of Concerns**: API separate from UI
- **Co-location**: Related code together
- **Single Responsibility**: Each file has one job
- **Type Safety**: TypeScript throughout

## Future Enhancements

If expanding beyond requirements:

1. **Features**
   - Task editing
   - Task deletion
   - Task categories/tags
   - Due dates
   - Task priorities
   - Bulk operations
   - Task sharing

2. **Technical**
   - Rate limiting
   - Caching (Redis)
   - Real-time updates (WebSockets)
   - Optimistic UI updates
   - Offline support (PWA)
   - Mobile app (React Native)

3. **User Experience**
   - Keyboard shortcuts
   - Drag-and-drop reordering
   - Dark mode
   - Multiple views (list/grid/calendar)
   - Filters (by status, date, etc.)

4. **Operations**
   - Monitoring (Sentry)
   - Analytics (Mixpanel/Amplitude)
   - Logging (Datadog)
   - CI/CD pipeline
   - Automated testing

## Lessons Learned

### What Went Well

1. **TypeScript** - Caught many errors early
2. **Prisma** - Smooth database operations
3. **NextAuth** - Easy OAuth integration
4. **App Router** - Modern, performant approach

### What Could Be Improved

1. **Testing** - Would add comprehensive tests
2. **Error Handling** - Could be more granular
3. **Loading States** - More sophisticated loading UI
4. **Validation** - Could use Zod for schema validation

### Trade-offs Made

1. **Simplicity vs Features** - Chose simplicity per requirements
2. **Performance vs Readability** - Chose readability
3. **Flexibility vs Constraints** - Enforced constraints for security

## Conclusion

This architecture provides:
- ✅ All required functionality
- ✅ Security best practices
- ✅ Scalable foundation
- ✅ Maintainable codebase
- ✅ Clear documentation
- ✅ Type safety throughout
- ✅ Modern tech stack

The design prioritizes correctness, security, and code quality while keeping the implementation scope focused on requirements.
