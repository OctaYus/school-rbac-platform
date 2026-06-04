import { cache } from "react";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface CurrentUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mfaEnabled: boolean;
  tokenVersion: number;
}

/**
 * Authoritative current-user lookup for server code.
 *
 * Always re-derives identity from the session and then re-reads the user from
 * the database, so a stale or tampered token cannot grant access to a disabled
 * account or an out-of-date role. Wrapped in React `cache` to dedupe within a
 * single request. Every server action / route handler MUST start here — never
 * trust client-supplied identity or role.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      tokenVersion: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});
