// Transparent proxy route handler with multi-backend support.
//
// URL scheme:
//   /api/telemt/<serverIndex>/v1/<endpoint>
//
// <serverIndex> is the 0-based backend index configured via TELEMT_API_BASE_URL_N.
// The backend Authorization header is injected server-side and never sent to
// the browser.

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/lib/backends";

const TIMEOUT_MS = 15_000;

// Only paths starting with /v1/ are forwarded to prevent SSRF.
function isAllowedPath(path: string): boolean {
  return path.startsWith("/v1/");
}

async function proxyRequest(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorized", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // First segment is the backend index, the rest form the upstream path.
  const [serverIndexStr, ...pathSegments] = segments;
  const serverIndex = Number(serverIndexStr);

  if (!Number.isInteger(serverIndex) || serverIndex < 0) {
    return NextResponse.json(
      { ok: false, error: { code: "bad_request", message: "Invalid server index" } },
      { status: 400 }
    );
  }

  const backend = getBackend(serverIndex);
  if (!backend) {
    return NextResponse.json(
      { ok: false, error: { code: "not_found", message: `Backend ${serverIndex} not configured` } },
      { status: 404 }
    );
  }

  const upstreamPath = `/${pathSegments.join("/")}${req.nextUrl.search}`;
  if (!isAllowedPath(upstreamPath)) {
    return NextResponse.json(
      { ok: false, error: { code: "forbidden", message: "Path not allowed" } },
      { status: 403 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
  };
  if (backend.authHeader) headers["Authorization"] = backend.authHeader;

  const ifMatch = req.headers.get("if-match");
  if (ifMatch) headers["If-Match"] = ifMatch;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${backend.baseUrl}${upstreamPath}`, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    const responseBody = await upstream.text();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return NextResponse.json(
      { ok: false, error: { code: "proxy_error", message } },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}