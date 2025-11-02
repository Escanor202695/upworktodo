import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = new URL(req.url);

  // Allow access to login and next-auth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/auth/signin" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // If token exists, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!auth/signin|api/auth|_next|favicon.ico|robots.txt).*)",
  ],
};
