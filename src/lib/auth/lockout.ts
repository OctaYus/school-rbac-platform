import { prisma } from "@/lib/db";

/**
 * Per-account login throttling with exponential backoff lockout.
 * (Per-IP throttling is layered on top in the login server action via Redis.)
 */
export const MAX_FAILED_BEFORE_LOCK = 5;
export const CAPTCHA_THRESHOLD = 3;

/** Lock duration grows exponentially after the threshold, capped at 60 min. */
export function lockDurationMs(failedCount: number): number {
  const over = Math.max(0, failedCount - MAX_FAILED_BEFORE_LOCK);
  const minutes = Math.min(2 ** over, 60);
  return minutes * 60_000;
}

export function isLocked(user: { lockedUntil: Date | null }): boolean {
  return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
}

export async function registerFailedLogin(userId: string): Promise<void> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });
  if (updated.failedLoginCount >= MAX_FAILED_BEFORE_LOCK) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() + lockDurationMs(updated.failedLoginCount)) },
    });
  }
}

export async function registerSuccessfulLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
