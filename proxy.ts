// Authentication proxy — protects all routes except login and auth callbacks.
// Next.js 16 uses proxy.ts instead of middleware.ts.

import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and auth-related paths.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};