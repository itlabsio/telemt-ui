// Kubernetes liveness probe endpoint.
// Returns 200 as long as the Next.js process is running.
// No authentication required — must be reachable by the kubelet.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, status: "alive" }, { status: 200 });
}