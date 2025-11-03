import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = new URL(req.url);

  // Allow access to NextAuth routes and the sign-in page
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/auth/signin"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users for page routes (non-API)
  if (!pathname.startsWith("/api") && !token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};


