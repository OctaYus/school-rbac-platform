import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Role, SessionStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { Capability, can } from "@/lib/auth/permissions";
import { listSessions } from "@/lib/data/sessions";
import { sessionListQuerySchema } from "@/lib/validation/session";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { SessionStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarkSessionActions } from "@/components/sessions/mark-session-actions";
import { DeleteSessionButton } from "@/components/sessions/delete-session-button";

export const metadata = { title: "Sessions · Scholaris" };

const SCOPES = ["upcoming", "past", "all"] as const;

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const query = sessionListQuerySchema.parse(sp);
  const rows = await listSessions(user, query);

  const isStaff = user.role !== Role.TEACHER;
  const canAssign = can(user.role, Capability.SESSION_ASSIGN);

  return (
    <>
      <PageHeader title="Sessions" description={isStaff ? "All sessions" : "Your schedule"}>
        {canAssign && (
          <Button asChild>
            <Link href="/sessions/assign">
              <Plus className="size-4" /> Assign session
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex gap-1">
        {SCOPES.map((s) => (
          <Button key={s} asChild variant={query.scope === s ? "default" : "outline"} size="sm">
            <Link href={`/sessions?scope=${s}`} className="capitalize">
              {s}
            </Link>
          </Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              {isStaff && <TableHead>Teacher</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isStaff ? 5 : 4}
                  className="text-muted-foreground py-8 text-center"
                >
                  No sessions.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => {
                const actionable =
                  s.status === SessionStatus.SCHEDULED || s.status === SessionStatus.RESCHEDULED;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{format(s.scheduledAt, "PP")}</div>
                      <div className="text-muted-foreground text-xs">
                        {format(s.scheduledAt, "p")} · {s.durationMin} min
                      </div>
                    </TableCell>
                    <TableCell>{s.type}</TableCell>
                    {isStaff && <TableCell>{s.teacher.name}</TableCell>}
                    <TableCell>
                      <SessionStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {actionable && <MarkSessionActions id={s.id} />}
                        {canAssign && (
                          <DeleteSessionButton
                            id={s.id}
                            label={`${s.type} · ${format(s.scheduledAt, "PP")}`}
                          />
                        )}
                        {!actionable && !canAssign && (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
