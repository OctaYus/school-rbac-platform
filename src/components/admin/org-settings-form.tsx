"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { updateOrganization } from "@/app/(app)/admin/organization/actions";
import { updateOrgSchema } from "@/lib/validation/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = z.infer<typeof updateOrgSchema>;

export function OrgSettingsForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: { name: initialName },
  });

  async function onSubmit(values: FormValues) {
    setMsg(null);
    setErr(null);
    const res = await updateOrganization(values);
    if (res.ok) {
      setMsg("Organization updated.");
      router.refresh();
    } else setErr(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      {err && <p className="text-destructive text-sm">{err}</p>}
      {msg && <p className="text-muted-foreground text-sm">{msg}</p>}
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Save
      </Button>
    </form>
  );
}
