"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { StudentStatus } from "@prisma/client";
import type { z } from "zod";

import { createStudent, updateStudent } from "@/app/(app)/students/actions";
import { createStudentSchema } from "@/lib/validation/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.input<typeof createStudentSchema>;

interface Props {
  initial?: {
    id: string;
    fullName: string;
    externalId: string | null;
    status: StudentStatus;
    notes: string | null;
  };
}

export function StudentForm({ initial }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      fullName: initial?.fullName ?? "",
      externalId: initial?.externalId ?? "",
      status: initial?.status ?? StudentStatus.ACTIVE,
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = initial
      ? await updateStudent({ ...values, id: initial.id })
      : await createStudent(values);
    if (result.ok) {
      const id = initial?.id ?? (result.data as { id: string } | undefined)?.id;
      router.push(id ? `/students/${id}` : "/students");
      router.refresh();
    } else {
      setServerError(result.error);
    }
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
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="externalId">External ID (optional)</Label>
        <Input id="externalId" {...register("externalId")} />
        {errors.externalId && (
          <p className="text-destructive text-xs">{errors.externalId.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register("status")}
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          {Object.values(StudentStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
        {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {initial ? "Save changes" : "Create student"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
