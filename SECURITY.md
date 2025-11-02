# Security Policy

## Security Features

This Todo application implements several security measures to protect user data and prevent common vulnerabilities.

### 1. Authentication & Authorization

**Google OAuth via NextAuth**
- Secure authentication flow using industry-standard OAuth 2.0
- No password storage - delegated to Google's secure infrastructure
- Session management with HTTP-only cookies
- CSRF protection built into NextAuth

**Session Security**
- Sessions stored in database (not JWT tokens)
- HTTP-only cookies prevent XSS-based session theft
- Secure cookie flag in production (HTTPS)
- Session token rotation on authentication

### 2. Data Isolation

**Per-User Data Access**
- All database queries filtered by authenticated user ID
- Users cannot access, modify, or delete other users' tasks
- Ownership verification on all modification operations

**Implementation Example:**
```typescript
// Every query includes user ID filter
const tasks = await prisma.task.findMany({
  where: {
    userId: session.user.id, // Ensures data isolation
    title: { contains: searchQuery }
  }
})
```

### 3. Input Validation

**Task Title Validation**
- Length: 1-200 characters
- Cannot be empty or only whitespace
- Automatically trimmed of leading/trailing whitespace
- Server-side validation (not just client-side)

**Query Parameter Validation**
- Page number: Minimum 1
- Page size: Minimum 1, Maximum 100
- Search query: Sanitized by Prisma

### 4. SQL Injection Prevention

**Prisma ORM Protection**
- All queries use parameterized statements
- No raw SQL queries in the application
- Prisma automatically escapes special characters

**Example Safe Query:**
```typescript
// This is safe from SQL injection
await prisma.task.findMany({
  where: {
    title: { contains: userInput } // Prisma handles escaping
  }
})
```

### 5. XSS (Cross-Site Scripting) Prevention

**React's Built-in Protection**
- React automatically escapes all rendered values
- User input is never directly inserted into HTML
- No use of `dangerouslySetInnerHTML`

**Example:**
```typescript
// This is safe - React escapes the content
<p>{task.title}</p>

// Even if task.title contains: <script>alert('xss')</script>
// React renders it as text, not executable code
```

### 6. CSRF Protection

**NextAuth CSRF Tokens**
- CSRF tokens automatically generated and validated
- Protects state-changing operations
- Built into NextAuth session management

### 7. API Security

**Authentication Required**
- All API endpoints check for valid session
- Unauthenticated requests return 401
- No public API access

**Proper HTTP Status Codes**
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Authenticated but not authorized
- 404 Not Found: Resource doesn't exist
- 400 Bad Request: Invalid input

### 8. Environment Variables

**Sensitive Data Protection**
- All secrets stored in environment variables
- `.env` file excluded from version control
- `.env.example` provided as template (no secrets)

**Required Environment Variables:**
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Session encryption key
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret

### 9. Database Security

**Prisma Schema Security**
- Foreign key constraints
- Cascade deletes (removing user deletes their tasks)
- Indexed queries for performance
- No exposed raw database access

**Schema Relationships:**
```prisma
model Task {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([userId, title])
}
```

### 10. Error Handling

**Secure Error Messages**
- Generic error messages to users
- Detailed errors logged server-side only
- No sensitive information in error responses

**Example:**
```typescript
try {
  // Database operation
} catch (error) {
  console.error('Error details:', error) // Server-side only
  return NextResponse.json(
    { error: 'Internal server error' }, // Generic message to client
    { status: 500 }
  )
}
```

## Security Best Practices

### For Development

1. **Never commit `.env` file** - Use `.env.example` for templates
2. **Use strong NEXTAUTH_SECRET** - Generate with `openssl rand -base64 32`
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use HTTPS in production** - Never send credentials over HTTP
5. **Validate all user input** - Both client and server side

### For Production

1. **Use managed PostgreSQL** - Don't expose database directly
2. **Enable SSL for database** - Add `?sslmode=require` to DATABASE_URL
3. **Set secure cookies** - NextAuth does this automatically on HTTPS
4. **Use environment variables** - Platform-specific (Vercel, Heroku, etc.)
5. **Monitor logs** - Set up error tracking (Sentry, LogRocket)
6. **Regular backups** - Database backup strategy
7. **Rate limiting** - Add rate limiting middleware
8. **Content Security Policy** - Add CSP headers in production

### Production Next.js Config Example

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Known Limitations

1. **No Rate Limiting** - Should be added for production
2. **No Email Verification** - Google handles this
3. **No Account Deletion** - Would need to add endpoint
4. **No Task Deletion** - Not in requirements, easy to add
5. **No Multi-Factor Auth** - Could be added via NextAuth

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security concerns to: [your-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

## Security Audit Checklist

- [x] Authentication required for all protected routes
- [x] Per-user data isolation enforced
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React)
- [x] CSRF protection (NextAuth)
- [x] Input validation (server-side)
- [x] Secure session management
- [x] Environment variables for secrets
- [x] Proper error handling
- [x] HTTP-only cookies
- [ ] Rate limiting (not implemented)
- [ ] Security headers (not configured)
- [ ] HTTPS enforced (production only)

## Dependencies Security

Run security audit:

```bash
npm audit
```

Fix vulnerabilities:

```bash
npm audit fix
```

Keep dependencies updated:

```bash
npm update
```

## Compliance Notes

- **GDPR**: Users can delete their account (would delete all tasks)
- **Data Minimization**: Only stores necessary user data
- **Right to Access**: Users can export their data via API
- **Data Portability**: API allows data export

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)

## Updates

This security policy will be updated as new features are added or vulnerabilities are discovered.

Last updated: 2024
