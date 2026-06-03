import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic endpoint — remove before any real use.
export async function GET() {
  try {
    const owner = await prisma.user.findUnique({
      where: { email: "owner@demo.school" },
      select: { passwordHash: true, failedLoginCount: true },
    });

    // Argon2 self-test: hash a value then verify it on this runtime.
    let argonRoundTrip: boolean | string = false;
    try {
      const h = await hashPassword("self-test-123");
      argonRoundTrip = await verifyPassword(h, "self-test-123");
    } catch (e) {
      argonRoundTrip = "throw:" + (e instanceof Error ? e.message : String(e));
    }

    // Verify the owner's stored hash against the known demo password.
    let ownerVerify: boolean | string = false;
    try {
      ownerVerify = owner?.passwordHash
        ? await verifyPassword(owner.passwordHash, "Aa1!CqJ7QDd6Mbnxvl6a6Vv_fBiW")
        : "no-hash";
    } catch (e) {
      ownerVerify = "throw:" + (e instanceof Error ? e.message : String(e));
    }

    return NextResponse.json({
      argonRoundTrip,
      ownerVerify,
      ownerFails: owner?.failedLoginCount ?? null,
      hashPrefix: owner?.passwordHash?.slice(0, 14) ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
