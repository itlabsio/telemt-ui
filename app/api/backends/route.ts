// Returns the list of configured backends (without auth headers) to the browser.
// Used by the server selector UI component.

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { backendInfoList } from "@/lib/backends";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: backendInfoList() });
}