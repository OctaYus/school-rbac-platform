"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { Role } from "@prisma/client";
import type { z } from "zod";

import { inviteUser } from "@/app/(app)/admin/users/actions";
import { inviteUserSchema } from "@/lib/validation/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormValues = z.infer<typeof inviteUserSchema>;

export function InviteUserDialog({ actorRole }: { actorRole: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", name: "", role: Role.TEACHER },
  });

  const assignableRoles = (
    actorRole === Role.OWNER
      ? [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]
      : [Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]
  ) as Role[];

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await inviteUser(values);
    if (res.ok) {
      setInviteUrl((res.data as { inviteUrl: string }).inviteUrl);
      reset();
      router.refresh();
    } else setServerError(res.error);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setInviteUrl(null);
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            Creates the account and generates a single-use activation link.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3">
            <p className="text-sm">Share this activation link (valid 72 hours):</p>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button
                type="button"
                variant="outline"
                onClick={() => navigator.clipboard?.writeText(inviteUrl)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" {...register("email")} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input id="invite-name" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                {...register("role")}
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create invite
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
