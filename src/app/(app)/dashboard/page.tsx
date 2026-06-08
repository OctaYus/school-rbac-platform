import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";
import { Role, StudentStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { SESSION_STATUS_KEY, STUDENT_STATUS_KEY } from "@/lib/i18n/enum-labels";
import {
  getAdminDashboard,
  getSupervisorDashboard,
  getTeacherDashboard,
} from "@/lib/data/dashboard";
import { getStatisticalBalance } from "@/lib/data/assessments";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { StudentStatusBadge } from "@/components/ui/status-badge";
import {
  ActivityFeed,
  BarBreakdown,
  CompletionRow,
  SectionCard,
  SessionList,
} from "@/components/dashboard/widgets";
import { StatisticalBalance } from "@/components/dashboard/statistical-balance";
import { StatusDonut, WeeklyActivityChart } from "@/components/dashboard/charts";

export const metadata = { title: "Dashboard · Scholaris" };

const STUDENT_HEX: Record<StudentStatus, string> = {
  ACTIVE: "#10b981",
  INACTIVE: "#a1a1aa",
  GRADUATED: "#0ea5e9",
  SUSPENDED: "#f43f5e",
  ARCHIVED: "#f59e0b",
};
const SESSION_COLOR: Record<string, string> = {
  SCHEDULED: "bg-indigo-500",
  TAKEN: "bg-emerald-500",
  MISSED: "bg-rose-500",
  RESCHEDULED: "bg-amber-500",
  CANCELLED: "bg-zinc-400",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dash.welcome")}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="secondary" className="h-7">
          {user.role}
        </Badge>
      </div>

      {user.role === Role.OWNER || user.role === Role.MANAGER ? (
        <AdminView organizationId={user.organizationId} />
      ) : user.role === Role.SUPERVISOR ? (
        <SupervisorView user={user} />
      ) : (
        <TeacherView user={user} />
      )}
    </div>
  );
}

async function AdminView({ organizationId }: { organizationId: string }) {
  const [d, balance] = await Promise.all([
    getAdminDashboard(organizationId),
    getStatisticalBalance(organizationId),
  ]);
  const { t } = await getI18n();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dash.activeStudents")}
          value={d.activeStudents}
          icon={Users}
          accent="indigo"
          trend={{ value: d.trends.students, label: t("dash.vsLastWeek"), goodWhenUp: true }}
        />
        <StatCard
          label={t("dash.sessionsToday")}
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
          trend={{ value: d.trends.sessions, label: t("dash.vsLastWeek"), goodWhenUp: true }}
        />
        <StatCard
          label={t("dash.overdueSessions")}
          value={d.overdue}
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard
          label={t("dash.activeUsers")}
          value={d.activeUsers}
          hint={`${d.totalStudents} ${t("common.total")}`}
          icon={UserCheck}
          accent="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={t("dash.activity7d")} href="/sessions" className="lg:col-span-2">
          <WeeklyActivityChart data={d.weeklySeries} />
        </SectionCard>
        <SectionCard title={t("dash.studentsByStatus")} href="/students">
          <StatusDonut
            data={Object.values(StudentStatus).map((s) => ({
              name: t(STUDENT_STATUS_KEY[s]),
              value: d.studentsByStatus[s] ?? 0,
              color: STUDENT_HEX[s],
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("dash.weekSessions")} href="/sessions">
          <BarBreakdown
            entries={(["SCHEDULED", "TAKEN", "MISSED", "RESCHEDULED", "CANCELLED"] as const).map(
              (s) => ({
                label: t(SESSION_STATUS_KEY[s]),
                value: d.weekSessionsByStatus[s] ?? 0,
                color: SESSION_COLOR[s],
              }),
            )}
          />
        </SectionCard>
        <SectionCard title={t("dash.recentActivity")} href="/admin/audit">
          <ActivityFeed items={d.recentAudit.map((a) => ({ ...a }))} />
        </SectionCard>
      </div>

      <StatisticalBalance data={balance} />

      <SectionCard title={t("dash.upcoming")} href="/sessions">
        <SessionList
          empty={t("dash.noUpcoming")}
          items={d.upcoming.map((s) => ({
            id: s.id,
            type: s.type,
            scheduledAt: s.scheduledAt,
            durationMin: s.durationMin,
            sub: s.teacherName,
          }))}
        />
      </SectionCard>
    </>
  );
}

async function SupervisorView({ user }: { user: Parameters<typeof getSupervisorDashboard>[0] }) {
  const [d, balance] = await Promise.all([
    getSupervisorDashboard(user),
    getStatisticalBalance(user.organizationId),
  ]);
  const { t } = await getI18n();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dash.scheduledThisWeek")}
          value={d.scheduledThisWeek}
          icon={CalendarClock}
          accent="indigo"
        />
        <StatCard
          label={t("dash.sessionsToday")}
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatCard
          label={t("dash.completion")}
          value={d.completionRate === null ? "—" : `${d.completionRate}%`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label={t("dash.needFollowUp")}
          value={d.followUp}
          icon={AlertTriangle}
          accent="rose"
        />
      </div>

      <StatisticalBalance data={balance} />

      <SectionCard title={t("dash.teacherCompletion")} href="/sessions">
        {d.teacherStats.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t("dash.noData")}</p>
        ) : (
          <div className="space-y-4">
            {d.teacherStats.map((tc) => (
              <CompletionRow key={tc.name} {...tc} />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

async function TeacherView({ user }: { user: Parameters<typeof getTeacherDashboard>[0] }) {
  const d = await getTeacherDashboard(user);
  const { t } = await getI18n();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dash.sessionsToday")}
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatCard
          label={t("dash.assignedStudents")}
          value={d.assignedStudents}
          icon={GraduationCap}
          accent="indigo"
        />
        <StatCard label={t("dash.overdue")} value={d.overdue} icon={AlertTriangle} accent="rose" />
        <StatCard
          label={t("dash.completedThisWeek")}
          value={d.completedThisWeek}
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("dash.todaySchedule")} href="/sessions">
          <SessionList
            empty={t("dash.nothingToday")}
            items={d.todaySchedule.map((s) => ({
              id: s.id,
              type: s.type,
              scheduledAt: s.scheduledAt,
              durationMin: s.durationMin,
              status: s.status,
            }))}
          />
        </SectionCard>
        <SectionCard title={t("dash.yourStudents")} href="/students">
          {d.myStudents.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t("dash.noStudents")}</p>
          ) : (
            <ul className="divide-y">
              {d.myStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/students/${s.id}`} className="text-sm font-medium hover:underline">
                    {s.fullName}
                  </Link>
                  <StudentStatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
