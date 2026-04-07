// Kubernetes readiness probe endpoint.
// Verifies the app can reach the Telemt backend before declaring itself ready.
// No authentication required — must be reachable by the kubelet.

import { NextResponse } from "next/server";
import { primaryBackend } from "@/lib/backends";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5_000;

export async function GET() {
  const backend = primaryBackend();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (backend.authHeader) headers["Authorization"] = backend.authHeader;

    const res = await fetch(`${backend.baseUrl}/v1/health`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: "not_ready", reason: `backend returned HTTP ${res.status}` },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, status: "ready" }, { status: 200 });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, status: "not_ready", reason },
      { status: 503 }
    );
  } finally {
    clearTimeout(timer);
  }
}