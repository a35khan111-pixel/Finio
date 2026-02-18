import { NextResponse, type NextRequest } from "next/server";

// Lightweight middleware — checks for the Supabase session cookie without
// importing the full @supabase/ssr client, which fails on Vercel's Edge Runtime.
// Full session validation happens in each server component / route handler.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");

  // Supabase SSR sets a cookie named sb-<project-ref>-auth-token
  const projectRef = "lhsmtgbixzhbggsrqbkx";
  const cookieBase = `sb-${projectRef}-auth-token`;

  // Support both whole-cookie and chunked-cookie formats
  const hasSession = request.cookies.has(cookieBase) ||
    request.cookies.has(`${cookieBase}.0`);

  // Not logged in → redirect to login (except for auth routes themselves)
  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Already logged in → redirect away from auth pages
  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
