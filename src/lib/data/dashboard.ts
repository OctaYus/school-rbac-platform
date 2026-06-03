import "server-only";
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subDays } from "date-fns";
import { SessionStatus, StudentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { scopedFor } from "@/lib/db/scope";
import type { CurrentUser } from "@/lib/auth/session";

export interface RecentAudit {
  id: string;
  action: string;
  entity: string;
  actorName: string;
  createdAt: Date;
}

export async function getAdminDashboard() {
  const now = new Date();
  const [activeStudents, sessionsToday, overdue, recentAudit] = await Promise.all([
    prisma.student.count({ where: { status: StudentStatus.ACTIVE } }),
    prisma.session.count({
      where: { scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.session.count({
      where: { status: SessionStatus.SCHEDULED, scheduledAt: { lt: now } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
  ]);

  return {
    activeStudents,
    sessionsToday,
    overdue,
    recentAudit: recentAudit.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      actorName: a.actor.name,
      createdAt: a.createdAt,
    })) satisfies RecentAudit[],
  };
}

export async function getSupervisorDashboard(user: CurrentUser) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const since = subDays(now, 30);

  const [scheduledThisWeek, taken, missed, followUp] = await Promise.all([
    prisma.session.count({
      where: { assignedById: user.id, scheduledAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.session.count({ where: { status: SessionStatus.TAKEN, scheduledAt: { gte: since } } }),
    prisma.session.count({ where: { status: SessionStatus.MISSED, scheduledAt: { gte: since } } }),
    prisma.student.count({ where: { status: StudentStatus.SUSPENDED } }),
  ]);

  const completed = taken + missed;
  const completionRate = completed === 0 ? null : Math.round((taken / completed) * 100);
  return { scheduledThisWeek, completionRate, followUp };
}

export async function getTeacherDashboard(user: CurrentUser) {
  const now = new Date();
  const scoped = scopedFor(user);
  const [sessionsToday, assignedStudents, overdue] = await Promise.all([
    scoped.session.count({
      where: { scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    scoped.student.count(),
    scoped.session.count({ where: { status: SessionStatus.SCHEDULED, scheduledAt: { lt: now } } }),
  ]);
  return { sessionsToday, assignedStudents, overdue };
}
