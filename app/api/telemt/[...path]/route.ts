// Transparent proxy route handler.
// Forwards authenticated browser requests to the Telemt backend API,
// injecting the backend Authorization header server-side so it is never
// exposed to the browser.

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.TELEMT_API_BASE_URL ?? "http://127.0.0.1:9091").replace(/\/$/, "");
const AUTH_HEADER = process.env.TELEMT_API_AUTH_HEADER ?? "";
const TIMEOUT_MS = 15_000;

// Restrict proxied paths to the known /v1 prefix to prevent SSRF.
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

  const upstreamPath = `/${segments.join("/")}${req.nextUrl.search}`;
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
  if (AUTH_HEADER) headers["Authorization"] = AUTH_HEADER;

  const ifMatch = req.headers.get("if-match");
  if (ifMatch) headers["If-Match"] = ifMatch;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BASE_URL}${upstreamPath}`, {
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