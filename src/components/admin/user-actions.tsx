"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MoreHorizontal, Power, ShieldOff, UserCog } from "lucide-react";
import { Role } from "@prisma/client";

import {
  changeUserRole,
  forceLogoutUser,
  resetUserMfa,
  setUserActive,
} from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  actorRole: Role;
  user: { id: string; role: Role; isActive: boolean; mfaEnabled: boolean };
  isSelf: boolean;
}

export function UserActions({ actorRole, user, isSelf }: Props) {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<Role>(user.role);
  const [busy, setBusy] = useState(false);

  // OWNER targets can only be managed by an OWNER.
  const canManage = !(user.role === Role.OWNER && actorRole !== Role.OWNER);

  const assignableRoles = (
    actorRole === Role.OWNER
      ? [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]
      : [Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]
  ) as Role[];

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(res.error ?? "Action failed.");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="User actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Manage</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={isSelf || !canManage || busy}
            onClick={() => run(() => setUserActive({ id: user.id, isActive: !user.isActive }))}
          >
            <Power /> {user.isActive ? "Disable account" : "Enable account"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isSelf || !canManage || busy}
            onClick={() => {
              setNewRole(user.role);
              setRoleOpen(true);
            }}
          >
            <UserCog /> Change role
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={busy}
            onClick={() => run(() => forceLogoutUser({ id: user.id }))}
          >
            <LogOut /> Force logout all sessions
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canManage || busy || !user.mfaEnabled}
            onClick={() => run(() => resetUserMfa({ id: user.id }))}
          >
            <ShieldOff /> Reset MFA
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
          </DialogHeader>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || newRole === user.role}
              onClick={async () => {
                await run(() => changeUserRole({ id: user.id, role: newRole }));
                setRoleOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
