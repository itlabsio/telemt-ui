// Kubernetes readiness probe endpoint.
// Verifies the Telemt backend is actually admitting traffic before declaring
// this pod ready — not just reachable. Proxies backend `/v1/health/ready`
// (HealthReadyData), which reports *why* it isn't ready (`admission_closed`
// or `no_healthy_upstreams`) instead of a bare ok/fail flag.
//
// The JSON reason below is not visible in `kubectl describe pod` Events for
// an httpGet probe — kubelet only records the HTTP status code there. See
// README.md "Kubernetes" section for an exec-based probe that surfaces this
// body text in Events too.
// No authentication required — must be reachable by the kubelet.

import { NextResponse } from "next/server";
import { primaryBackend } from "@/lib/backends";
import type { ApiResponse } from "@/types/api";

interface HealthReadyData {
  ready: boolean;
  status: string;
  reason?: string;
  admission_open: boolean;
  healthy_upstreams: number;
  total_upstreams: number;
}

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5_000;

export async function GET() {
  const backend = primaryBackend();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (backend.authHeader) headers["Authorization"] = backend.authHeader;

    const res = await fetch(`${backend.baseUrl}/v1/health/ready`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    let body: ApiResponse<HealthReadyData> | undefined;
    try {
      body = await res.json();
    } catch {
      // Backend returned a non-JSON body; fall through to the generic error below.
    }

    if (!res.ok || !body?.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "not_ready",
          reason:
            body && !body.ok
              ? body.error.message
              : `backend returned HTTP ${res.status}`,
        },
        { status: 503 }
      );
    }

    if (!body.data.ready) {
      return NextResponse.json(
        {
          ok: false,
          status: "not_ready",
          reason: body.data.reason ?? "not_ready",
          healthy_upstreams: body.data.healthy_upstreams,
          total_upstreams: body.data.total_upstreams,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: "ready",
        healthy_upstreams: body.data.healthy_upstreams,
        total_upstreams: body.data.total_upstreams,
      },
      { status: 200 }
    );
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