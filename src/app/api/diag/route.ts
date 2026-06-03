import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic endpoint — remove before any real use.
export async function GET() {
  try {
    const users = await prisma.user.count();
    const owner = await prisma.user.findUnique({
      where: { email: "owner@demo.school" },
      select: { id: true, isActive: true, lockedUntil: true },
    });
    const host = (process.env.DATABASE_URL ?? "").replace(/^.*@([^/?]*).*$/, "$1");
    return NextResponse.json({
      users,
      ownerFound: !!owner,
      ownerActive: owner?.isActive ?? null,
      ownerLocked: owner?.lockedUntil ?? null,
      dbHost: host,
      hasEncKey: !!process.env.ENCRYPTION_KEY,
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
