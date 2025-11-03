import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Always allow NextAuth routes, sign-in page, and static assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/auth/signin" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // For API routes, let them handle their own auth (they check session internally)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // For page routes, redirect to sign-in if not authenticated
  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};


