import "server-only";
import { endOfDay, endOfWeek, format, startOfDay, startOfWeek, subDays } from "date-fns";
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

export interface DaySeriesPoint {
  label: string;
  taken: number;
  total: number;
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
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
// Admin (OWNER / MANAGER) — scoped to the caller's organization
// ---------------------------------------------------------------------------
export async function getAdminDashboard(organizationId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subDays(weekStart, 7);
  const sevenDaysAgo = startOfDay(subDays(now, 6));
  const org = { organizationId };

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
    prisma.student.count({ where: { ...org, status: StudentStatus.ACTIVE } }),
    prisma.student.count({ where: org }),
    prisma.session.count({
      where: { ...org, scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.session.count({
      where: { ...org, status: SessionStatus.SCHEDULED, scheduledAt: { lt: now } },
    }),
    prisma.user.count({ where: { ...org, isActive: true } }),
    prisma.student.groupBy({ by: ["status"], where: org, _count: true }),
    prisma.session.groupBy({
      by: ["status"],
      where: { ...org, scheduledAt: { gte: weekStart, lte: weekEnd } },
      _count: true,
    }),
    prisma.auditLog.findMany({
      where: org,
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
      where: { ...org, status: SessionStatus.SCHEDULED, scheduledAt: { gte: now } },
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

  // CRM trend + activity series.
  const [newThisWeek, newLastWeek, takenThisWeek, takenLastWeek, recentSessions] =
    await Promise.all([
      prisma.student.count({ where: { ...org, createdAt: { gte: weekStart } } }),
      prisma.student.count({
        where: { ...org, createdAt: { gte: lastWeekStart, lt: weekStart } },
      }),
      prisma.session.count({
        where: {
          ...org,
          status: SessionStatus.TAKEN,
          scheduledAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.session.count({
        where: {
          ...org,
          status: SessionStatus.TAKEN,
          scheduledAt: { gte: lastWeekStart, lt: weekStart },
        },
      }),
      prisma.session.findMany({
        where: { ...org, scheduledAt: { gte: sevenDaysAgo } },
        select: { scheduledAt: true, status: true },
      }),
    ]);

  // Bucket the last 7 days for the activity chart.
  const weeklySeries: DaySeriesPoint[] = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(now, 6 - i));
    const dayEnd = endOfDay(day);
    const inDay = recentSessions.filter((s) => s.scheduledAt >= day && s.scheduledAt <= dayEnd);
    return {
      label: format(day, "EEE"),
      taken: inDay.filter((s) => s.status === SessionStatus.TAKEN).length,
      total: inDay.length,
    };
  });

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
    weeklySeries,
    newThisWeek,
    trends: {
      students: pctDelta(newThisWeek, newLastWeek),
      sessions: pctDelta(takenThisWeek, takenLastWeek),
    },
  };
}

// ---------------------------------------------------------------------------
// Supervisor — scoped to the caller's organization
// ---------------------------------------------------------------------------
export async function getSupervisorDashboard(user: CurrentUser) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const since = subDays(now, 30);
  const org = { organizationId: user.organizationId };

  const [scheduledThisWeek, sessionsToday, taken, missed, followUp, totalGrouped, takenGrouped] =
    await Promise.all([
      prisma.session.count({
        where: { ...org, assignedById: user.id, scheduledAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.session.count({
        where: {
          ...org,
          assignedById: user.id,
          scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) },
        },
      }),
      prisma.session.count({
        where: { ...org, status: SessionStatus.TAKEN, scheduledAt: { gte: since } },
      }),
      prisma.session.count({
        where: { ...org, status: SessionStatus.MISSED, scheduledAt: { gte: since } },
      }),
      prisma.student.count({ where: { ...org, status: StudentStatus.SUSPENDED } }),
      prisma.session.groupBy({
        by: ["teacherId"],
        where: { ...org, scheduledAt: { gte: since } },
        _count: true,
      }),
      prisma.session.groupBy({
        by: ["teacherId"],
        where: { ...org, scheduledAt: { gte: since }, status: SessionStatus.TAKEN },
        _count: true,
      }),
    ]);

  const totals = countsByKey(totalGrouped, "teacherId");
  const takens = countsByKey(takenGrouped, "teacherId");
  const teacherIds = Object.keys(totals);
  const teachers = await prisma.user.findMany({
    where: { ...org, id: { in: teacherIds } },
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
// Teacher — all reads go through scopedFor (org + assignment scoped)
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
