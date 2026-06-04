import "server-only";
import { cache } from "react";
import type { PlanTier } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export interface CurrentOrg {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  trialEndsAt: Date | null;
}

/** The current user's organization (tenant). Cached per request. */
export const getCurrentOrg = cache(async (): Promise<CurrentOrg | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, name: true, slug: true, plan: true, trialEndsAt: true },
  });
});
