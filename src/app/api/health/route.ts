import { NextResponse } from "next/server";

import { apiLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public health check (rate-limited). Returns JSON only. */
export async function GET() {
  const ip = await getClientIp();
  const { success } = await apiLimiter.limit(`health:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
