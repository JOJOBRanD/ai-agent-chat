import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side auth middleware — runs BEFORE page/API rendering.
 * Protects /chat and /admin routes by checking the session cookie.
 * If no valid session cookie, redirect to /login.
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/chat", "/admin"];

// Routes that are always public
const PUBLIC_ROUTES = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes, static files, and API routes (APIs have their own auth)
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = req.cookies.get("session")?.value;
  if (!session) {
    // No session cookie → redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists — allow through
  // (The actual session validation happens in the API routes)
  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
