import "server-only";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AuditQuery } from "@/lib/validation/admin";

export async function listUsers(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      lastLoginAt: true,
      passwordHash: true,
    },
  });
  // `pending` = invited but not yet activated. Never expose the hash itself.
  return users.map(({ passwordHash, ...u }) => ({ ...u, pending: !passwordHash }));
}

export async function getOrgOverview(organizationId: string) {
  const [org, members, students, sessions] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, plan: true, trialEndsAt: true, createdAt: true },
    }),
    prisma.user.count({ where: { organizationId } }),
    prisma.student.count({ where: { organizationId } }),
    prisma.session.count({ where: { organizationId } }),
  ]);
  return { org, members, students, sessions };
}

export const AUDIT_PAGE_SIZE = 25;

export async function listAudit(organizationId: string, query: AuditQuery) {
  const where: Prisma.AuditLogWhereInput = { organizationId };
  if (query.actorId) where.actorId = query.actorId;
  if (query.entity) where.entity = query.entity;
  if (query.action) where.action = { contains: query.action, mode: "insensitive" };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ip: true,
        createdAt: true,
        diff: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    rows,
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
  };
}
