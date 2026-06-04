import { formatDistanceToNow } from "date-fns";

import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { listUsers } from "@/lib/data/admin";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { ActiveBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UserActions } from "@/components/admin/user-actions";

export const metadata = { title: "Users · Scholaris" };

export default async function AdminUsersPage() {
  const actor = await requireCapability(Capability.USER_MANAGE);
  const users = await listUsers();

  return (
    <>
      <PageHeader title="Users" description="Create, disable, and manage accounts.">
        <InviteUserDialog actorRole={actor.role} />
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MFA</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-muted-foreground text-xs">{u.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.role}</Badge>
                </TableCell>
                <TableCell>
                  {u.pending ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/25">
                      Invited
                    </span>
                  ) : (
                    <ActiveBadge active={u.isActive} />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {u.mfaEnabled ? "On" : "Off"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {u.lastLoginAt
                    ? formatDistanceToNow(u.lastLoginAt, { addSuffix: true })
                    : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <UserActions
                    actorRole={actor.role}
                    user={{
                      id: u.id,
                      role: u.role,
                      isActive: u.isActive,
                      mfaEnabled: u.mfaEnabled,
                      pending: u.pending,
                    }}
                    isSelf={u.id === actor.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
