import "server-only";
import { startOfDay } from "date-fns";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sessionScopeWhere } from "@/lib/db/scope";
import type { CurrentUser } from "@/lib/auth/session";
import type { SessionListQuery } from "@/lib/validation/session";

export async function listSessions(user: CurrentUser, query: SessionListQuery) {
  const now = new Date();
  const filters: Prisma.SessionWhereInput = {};

  if (query.scope === "upcoming") filters.scheduledAt = { gte: startOfDay(now) };
  else if (query.scope === "past") filters.scheduledAt = { lt: now };
  if (query.status) filters.status = query.status;
  // Staff can filter by a specific teacher; teachers are auto-scoped to self.
  if (query.teacherId && user.role !== Role.TEACHER) filters.teacherId = query.teacherId;

  const where: Prisma.SessionWhereInput = { AND: [filters, sessionScopeWhere(user)] };

  return prisma.session.findMany({
    where,
    orderBy: { scheduledAt: query.scope === "past" ? "desc" : "asc" },
    take: 200,
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      durationMin: true,
      status: true,
      notes: true,
      takenAt: true,
      teacher: { select: { id: true, name: true } },
    },
  });
}

export type SessionRow = Awaited<ReturnType<typeof listSessions>>[number];

export async function getActiveTeachers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: Role.TEACHER, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export async function getSessionTemplates(organizationId: string) {
  return prisma.sessionTemplate.findMany({
    where: { organizationId },
    orderBy: { type: "asc" },
    select: { id: true, type: true, defaultDuration: true },
  });
}
