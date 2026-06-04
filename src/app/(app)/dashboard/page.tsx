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
import {
  getAdminDashboard,
  getSupervisorDashboard,
  getTeacherDashboard,
} from "@/lib/data/dashboard";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  ActivityFeed,
  BarBreakdown,
  CompletionRow,
  SectionCard,
  SessionList,
} from "@/components/dashboard/widgets";

export const metadata = { title: "Dashboard · Scholaris" };

const STUDENT_COLOR: Record<StudentStatus, string> = {
  ACTIVE: "bg-emerald-500",
  INACTIVE: "bg-zinc-400",
  GRADUATED: "bg-sky-500",
  SUSPENDED: "bg-rose-500",
  ARCHIVED: "bg-amber-500",
};
const SESSION_COLOR: Record<string, string> = {
  SCHEDULED: "bg-indigo-500",
  TAKEN: "bg-emerald-500",
  MISSED: "bg-rose-500",
  RESCHEDULED: "bg-amber-500",
  CANCELLED: "bg-zinc-400",
};
const STUDENT_BADGE: Record<StudentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  GRADUATED: "outline",
  SUSPENDED: "destructive",
  ARCHIVED: "secondary",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
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
        <AdminView />
      ) : user.role === Role.SUPERVISOR ? (
        <SupervisorView user={user} />
      ) : (
        <TeacherView user={user} />
      )}
    </div>
  );
}

async function AdminView() {
  const d = await getAdminDashboard();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active students"
          value={d.activeStudents}
          hint={`${d.totalStudents} total`}
          icon={Users}
          accent="indigo"
        />
        <StatCard
          label="Sessions today"
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatCard
          label="Overdue sessions"
          value={d.overdue}
          hint="Scheduled, not actioned"
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard label="Active users" value={d.activeUsers} icon={UserCheck} accent="emerald" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Students by status" href="/students">
          <BarBreakdown
            entries={Object.values(StudentStatus).map((s) => ({
              label: s,
              value: d.studentsByStatus[s] ?? 0,
              color: STUDENT_COLOR[s],
            }))}
          />
        </SectionCard>
        <SectionCard title="This week's sessions" href="/sessions">
          <BarBreakdown
            entries={["SCHEDULED", "TAKEN", "MISSED", "RESCHEDULED", "CANCELLED"].map((s) => ({
              label: s,
              value: d.weekSessionsByStatus[s] ?? 0,
              color: SESSION_COLOR[s],
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Upcoming sessions" href="/sessions" linkLabel="Schedule">
          <SessionList
            empty="No upcoming sessions."
            items={d.upcoming.map((s) => ({
              id: s.id,
              type: s.type,
              scheduledAt: s.scheduledAt,
              durationMin: s.durationMin,
              sub: s.teacherName,
            }))}
          />
        </SectionCard>
        <SectionCard title="Recent activity" href="/admin/audit" linkLabel="Audit log">
          <ActivityFeed items={d.recentAudit.map((a) => ({ ...a }))} />
        </SectionCard>
      </div>
    </>
  );
}

async function SupervisorView({ user }: { user: Parameters<typeof getSupervisorDashboard>[0] }) {
  const d = await getSupervisorDashboard(user);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Scheduled this week"
          value={d.scheduledThisWeek}
          icon={CalendarClock}
          accent="indigo"
        />
        <StatCard
          label="Sessions today"
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatCard
          label="Completion (30d)"
          value={d.completionRate === null ? "—" : `${d.completionRate}%`}
          hint="Taken vs taken+missed"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Need follow-up"
          value={d.followUp}
          hint="Suspended students"
          icon={AlertTriangle}
          accent="rose"
        />
      </div>

      <SectionCard title="Teacher completion (last 30 days)" href="/sessions">
        {d.teacherStats.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No session data yet.</p>
        ) : (
          <div className="space-y-4">
            {d.teacherStats.map((t) => (
              <CompletionRow key={t.name} {...t} />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

async function TeacherView({ user }: { user: Parameters<typeof getTeacherDashboard>[0] }) {
  const d = await getTeacherDashboard(user);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions today"
          value={d.sessionsToday}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatCard
          label="Assigned students"
          value={d.assignedStudents}
          icon={GraduationCap}
          accent="indigo"
        />
        <StatCard
          label="Overdue"
          value={d.overdue}
          hint="Mark taken / missed"
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard
          label="Completed this week"
          value={d.completedThisWeek}
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Today's schedule" href="/sessions">
          <SessionList
            empty="Nothing scheduled today."
            items={d.todaySchedule.map((s) => ({
              id: s.id,
              type: s.type,
              scheduledAt: s.scheduledAt,
              durationMin: s.durationMin,
              status: s.status,
            }))}
          />
        </SectionCard>
        <SectionCard title="Your students" href="/students">
          {d.myStudents.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">No assigned students.</p>
          ) : (
            <ul className="divide-y">
              {d.myStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/students/${s.id}`} className="text-sm font-medium hover:underline">
                    {s.fullName}
                  </Link>
                  <Badge variant={STUDENT_BADGE[s.status]}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
