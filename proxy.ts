// Authentication proxy — protects all routes except login and auth callbacks.
// Next.js 16 uses proxy.ts instead of middleware.ts.
//
// Also attaches a per-request nonce and Content-Security-Policy header.
// Next.js automatically applies the nonce to its own framework/hydration
// scripts once it sees it in the CSP response header — no manual wiring
// needed since this app doesn't render any inline <script> of its own.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const isDev = process.env.NODE_ENV === "development";

export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and auth callback routes.
    // Health probes are excluded too — they're plain JSON polled frequently
    // by the kubelet and don't need CSP or a session lookup.
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};