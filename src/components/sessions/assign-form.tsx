"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { assignSession } from "@/app/(app)/sessions/actions";
import { assignSessionSchema } from "@/lib/validation/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  teachers: { id: string; name: string; email: string }[];
  templates: { id: string; type: string; defaultDuration: number }[];
}

type Values = z.input<typeof assignSessionSchema>;

export function AssignForm({ teachers, templates }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(assignSessionSchema),
    defaultValues: { teacherId: "", type: "", durationMin: 45, notes: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const res = await assignSession(values);
    if (res.ok) {
      router.push("/sessions");
      router.refresh();
    } else setServerError(res.error);
  }

  function onTypeChange(value: string) {
    const tpl = templates.find((t) => t.type === value);
    if (tpl) setValue("durationMin", tpl.defaultDuration);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4" noValidate>
      {serverError && (
        <p
          role="alert"
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {serverError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <select
          id="teacherId"
          {...register("teacherId")}
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">Select a teacher…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.email})
            </option>
          ))}
        </select>
        {errors.teacherId && <p className="text-destructive text-xs">{errors.teacherId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Session type</Label>
        <Input
          id="type"
          list="session-types"
          {...register("type", { onChange: (e) => onTypeChange(e.target.value) })}
        />
        <datalist id="session-types">
          {templates.map((t) => (
            <option key={t.id} value={t.type} />
          ))}
        </datalist>
        {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Date &amp; time</Label>
          <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
          {errors.scheduledAt && (
            <p className="text-destructive text-xs">{errors.scheduledAt.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duration (minutes)</Label>
          <Input id="durationMin" type="number" {...register("durationMin")} />
          {errors.durationMin && (
            <p className="text-destructive text-xs">{errors.durationMin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Assign session
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
