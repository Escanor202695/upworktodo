# Setup Guide

This guide provides detailed, step-by-step instructions to get the Todo app running on your local machine.

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed ([download](https://nodejs.org/))
2. **PostgreSQL** installed and running ([download](https://www.postgresql.org/download/))
3. **npm** (comes with Node.js)
4. A **Google Cloud Console** account (free tier available)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, NextAuth, Prisma, and more.

## Step 2: Set Up PostgreSQL Database

### Option A: Using psql command line

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE todoapp;

# Exit psql
\q
```

### Option B: Using GUI tools

Use tools like pgAdmin, DBeaver, or TablePlus to create a database named `todoapp`.

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the following:

### Database URL

Replace with your PostgreSQL connection details:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/todoapp?schema=public"
```

For example:
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/todoapp?schema=public"
```

### NextAuth Secret

Generate a secure random string:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`:

```env
NEXTAUTH_SECRET="paste-generated-secret-here"
```

### Google OAuth Credentials

Follow Step 4 below to get these values.

## Step 4: Set Up Google OAuth

### 4.1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### 4.2: Create a New Project

1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it "Todo App" (or any name you prefer)
4. Click "Create"
5. Wait for the project to be created, then select it

### 4.3: Enable Google+ API

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 4.4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted to configure the OAuth consent screen:
   - Choose "External" user type
   - Click "Create"
   - Fill in required fields:
     - App name: "Todo App"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Skip scopes and test users
   - Click "Save and Continue"

4. Now create the OAuth Client ID:
   - Application type: "Web application"
   - Name: "Todo App Web Client"
   - Authorized redirect URIs, click "Add URI":
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Create"

5. A dialog will show your credentials:
   - Copy the **Client ID**
   - Copy the **Client Secret**

### 4.5: Update .env File

Add the credentials to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

## Step 5: Set Up Database Schema

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all necessary tables (User, Account, Session, Task, etc.)
- Generate the Prisma Client

If you encounter errors, ensure:
- PostgreSQL is running
- Your DATABASE_URL is correct
- You have permission to create tables

## Step 6: Verify Setup

Check that everything is configured:

```bash
# View the database in Prisma Studio
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can view your empty tables.

## Step 7: Start the Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`.

## Step 8: Test the Application

1. **Open your browser** to `http://localhost:3000`
2. You'll be redirected to the sign-in page
3. Click "Sign in with Google"
4. Authorize the app with your Google account
5. You'll be redirected back to the app
6. **Create your first task!**

## Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"

**Solution**:
- Ensure PostgreSQL is running: `sudo service postgresql status` (Linux) or check Services (Windows)
- Verify your DATABASE_URL credentials
- Test connection with: `psql -U postgres -d todoapp`

### Google OAuth Issues

**Error**: "redirect_uri_mismatch"

**Solution**:
- Ensure the redirect URI in Google Console matches exactly: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Use `http://` not `https://` for localhost

**Error**: "Access blocked: This app's request is invalid"

**Solution**:
- Complete the OAuth consent screen configuration
- Add your email as a test user in Google Console

### Prisma Issues

**Error**: "Environment variable not found: DATABASE_URL"

**Solution**:
- Ensure `.env` file exists in the project root
- Check that DATABASE_URL is spelled correctly
- Restart your terminal/IDE

**Error**: "Prisma schema has migration errors"

**Solution**:
```bash
# Reset the database and migrations
npx prisma migrate reset
# Recreate everything
npx prisma migrate dev --name init
```

### Port Already in Use

**Error**: "Port 3000 is already in use"

**Solution**:
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
# Or use a different port
PORT=3001 npm run dev
```

## Next Steps

Once running:

1. **Create tasks** to test the functionality
2. **Test search** by creating multiple tasks and searching
3. **Test pagination** by creating 15+ tasks
4. **Try signing in from a different Google account** to verify data isolation
5. **Check the API** using tools like Postman or curl

## Development Tips

### View Database Contents

```bash
npx prisma studio
```

### Reset Database

```bash
npx prisma migrate reset
```

### Format Prisma Schema

```bash
npx prisma format
```

### Check for Migration Drift

```bash
npx prisma migrate status
```

## Production Deployment

See README.md section "Production Deployment" for details on deploying to platforms like Vercel, Heroku, or AWS.

Key changes for production:
1. Use a managed PostgreSQL database
2. Update NEXTAUTH_URL to your domain
3. Add production redirect URI to Google Console
4. Use environment variables in your hosting platform
5. Run `npx prisma migrate deploy` instead of `migrate dev`

## Getting Help

If you encounter issues not covered here:

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Check the [NextAuth documentation](https://next-auth.js.org/)
3. Check the [Prisma documentation](https://www.prisma.io/docs)
4. Look at the application logs in the terminal
5. Check the browser console for frontend errors

## Success!

You should now have a fully functional Todo app running locally. Happy coding! 🎉
