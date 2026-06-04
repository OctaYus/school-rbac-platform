import "server-only";
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subDays } from "date-fns";
import { SessionStatus, StudentStatus, type Prisma } from "@prisma/client";

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

export interface UpcomingSession {
  id: string;
  type: string;
  scheduledAt: Date;
  durationMin: number;
  teacherName: string;
}

function countsByKey<T extends { _count: number }>(
  groups: T[],
  key: keyof T,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of groups) out[String(g[key])] = g._count;
  return out;
}

// ---------------------------------------------------------------------------
// Admin (OWNER / MANAGER)
// ---------------------------------------------------------------------------
export async function getAdminDashboard() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [
    activeStudents,
    totalStudents,
    sessionsToday,
    overdue,
    activeUsers,
    studentsByStatusRaw,
    weekSessionsByStatusRaw,
    recentAudit,
    upcoming,
  ] = await Promise.all([
    prisma.student.count({ where: { status: StudentStatus.ACTIVE } }),
    prisma.student.count(),
    prisma.session.count({ where: { scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.session.count({ where: { status: SessionStatus.SCHEDULED, scheduledAt: { lt: now } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.student.groupBy({ by: ["status"], _count: true }),
    prisma.session.groupBy({
      by: ["status"],
      where: { scheduledAt: { gte: weekStart, lte: weekEnd } },
      _count: true,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
    prisma.session.findMany({
      where: { status: SessionStatus.SCHEDULED, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        type: true,
        scheduledAt: true,
        durationMin: true,
        teacher: { select: { name: true } },
      },
    }),
  ]);

  return {
    activeStudents,
    totalStudents,
    sessionsToday,
    overdue,
    activeUsers,
    studentsByStatus: countsByKey(studentsByStatusRaw, "status"),
    weekSessionsByStatus: countsByKey(weekSessionsByStatusRaw, "status"),
    recentAudit: recentAudit.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      actorName: a.actor.name,
      createdAt: a.createdAt,
    })) satisfies RecentAudit[],
    upcoming: upcoming.map((s) => ({
      id: s.id,
      type: s.type,
      scheduledAt: s.scheduledAt,
      durationMin: s.durationMin,
      teacherName: s.teacher.name,
    })) satisfies UpcomingSession[],
  };
}

// ---------------------------------------------------------------------------
// Supervisor
// ---------------------------------------------------------------------------
export async function getSupervisorDashboard(user: CurrentUser) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const since = subDays(now, 30);

  const [scheduledThisWeek, sessionsToday, taken, missed, followUp, totalGrouped, takenGrouped] =
    await Promise.all([
      prisma.session.count({
        where: { assignedById: user.id, scheduledAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.session.count({
        where: { assignedById: user.id, scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      }),
      prisma.session.count({ where: { status: SessionStatus.TAKEN, scheduledAt: { gte: since } } }),
      prisma.session.count({
        where: { status: SessionStatus.MISSED, scheduledAt: { gte: since } },
      }),
      prisma.student.count({ where: { status: StudentStatus.SUSPENDED } }),
      prisma.session.groupBy({
        by: ["teacherId"],
        where: { scheduledAt: { gte: since } },
        _count: true,
      }),
      prisma.session.groupBy({
        by: ["teacherId"],
        where: { scheduledAt: { gte: since }, status: SessionStatus.TAKEN },
        _count: true,
      }),
    ]);

  const totals = countsByKey(totalGrouped, "teacherId");
  const takens = countsByKey(takenGrouped, "teacherId");
  const teacherIds = Object.keys(totals);
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true },
  });
  const teacherStats = teachers
    .map((t) => {
      const total = totals[t.id] ?? 0;
      const done = takens[t.id] ?? 0;
      return {
        name: t.name,
        total,
        taken: done,
        rate: total ? Math.round((done / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const completed = taken + missed;
  return {
    scheduledThisWeek,
    sessionsToday,
    completionRate: completed === 0 ? null : Math.round((taken / completed) * 100),
    followUp,
    teacherStats,
  };
}

// ---------------------------------------------------------------------------
// Teacher
// ---------------------------------------------------------------------------
export async function getTeacherDashboard(user: CurrentUser) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const scoped = scopedFor(user);

  const todayWhere: Prisma.SessionWhereInput = {
    scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) },
  };

  const [sessionsToday, assignedStudents, overdue, completedThisWeek, todaySchedule, myStudents] =
    await Promise.all([
      scoped.session.count({ where: todayWhere }),
      scoped.student.count(),
      scoped.session.count({
        where: { status: SessionStatus.SCHEDULED, scheduledAt: { lt: now } },
      }),
      scoped.session.count({
        where: { status: SessionStatus.TAKEN, scheduledAt: { gte: weekStart, lte: weekEnd } },
      }),
      scoped.session.findMany({
        where: todayWhere,
        orderBy: { scheduledAt: "asc" },
        select: { id: true, type: true, scheduledAt: true, durationMin: true, status: true },
      }),
      scoped.student.findMany({
        orderBy: { fullName: "asc" },
        take: 6,
        select: { id: true, fullName: true, status: true },
      }),
    ]);

  return { sessionsToday, assignedStudents, overdue, completedThisWeek, todaySchedule, myStudents };
}
