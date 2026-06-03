"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { changePassword, updateProfile } from "@/app/(app)/account/actions";
import { signOutAction } from "@/app/(app)/actions";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validation/account";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  type Values = z.infer<typeof updateProfileSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: initialName },
  });

  async function onSubmit(values: Values) {
    setMsg(null);
    setErr(null);
    const res = await updateProfile(values);
    if (res.ok) {
      setMsg("Profile updated.");
      router.refresh();
    } else setErr(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {err && <p className="text-destructive text-sm">{err}</p>}
      {msg && <p className="text-muted-foreground text-sm">{msg}</p>}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  type Values = z.infer<typeof changePasswordSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: Values) {
    setErr(null);
    const res = await changePassword(values);
    if (res.ok) {
      setDone(true);
      // Password change invalidated this session — sign out and back to login.
      setTimeout(() => signOutAction(), 1200);
    } else setErr(res.error);
  }

  if (done) {
    return (
      <p role="status" className="bg-muted rounded-md border px-3 py-2 text-sm">
        Password changed. Signing you out — please sign in again…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {err && <p className="text-destructive text-sm">{err}</p>}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-destructive text-xs">{errors.currentPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <p className="text-destructive text-xs">{errors.newPassword.message}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            At least {PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol.
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Change password
      </Button>
    </form>
  );
}
