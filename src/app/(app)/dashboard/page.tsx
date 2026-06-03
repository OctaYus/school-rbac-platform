import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CalendarCheck, ClipboardList, GraduationCap, Users } from "lucide-react";
import { Role } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import {
  getAdminDashboard,
  getSupervisorDashboard,
  getTeacherDashboard,
} from "@/lib/data/dashboard";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard · Scholaris" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={`Signed in as ${user.role}`}
      />
      {user.role === Role.OWNER || user.role === Role.MANAGER ? (
        <AdminView />
      ) : user.role === Role.SUPERVISOR ? (
        <SupervisorView user={user} />
      ) : (
        <TeacherView user={user} />
      )}
    </>
  );
}

async function AdminView() {
  const data = await getAdminDashboard();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active students" value={data.activeStudents} icon={Users} />
        <StatCard label="Sessions today" value={data.sessionsToday} icon={CalendarCheck} />
        <StatCard
          label="Overdue sessions"
          value={data.overdue}
          icon={AlertTriangle}
          hint="Scheduled in the past, not yet actioned"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent audit events</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentAudit.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.recentAudit.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">{a.actorName}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function SupervisorView({ user }: { user: Parameters<typeof getSupervisorDashboard>[0] }) {
  const data = await getSupervisorDashboard(user);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Sessions you scheduled (this week)"
        value={data.scheduledThisWeek}
        icon={ClipboardList}
      />
      <StatCard
        label="Completion rate (30d)"
        value={data.completionRate === null ? "—" : `${data.completionRate}%`}
        icon={CalendarCheck}
        hint="Taken vs. taken+missed"
      />
      <StatCard
        label="Students needing follow-up"
        value={data.followUp}
        icon={AlertTriangle}
        hint="Suspended status"
      />
    </div>
  );
}

async function TeacherView({ user }: { user: Parameters<typeof getTeacherDashboard>[0] }) {
  const data = await getTeacherDashboard(user);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Your sessions today" value={data.sessionsToday} icon={CalendarCheck} />
      <StatCard label="Assigned students" value={data.assignedStudents} icon={GraduationCap} />
      <StatCard
        label="Overdue sessions"
        value={data.overdue}
        icon={AlertTriangle}
        hint="Mark as taken / missed"
      />
    </div>
  );
}
