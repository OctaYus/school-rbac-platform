"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { HealthCategory } from "@prisma/client";
import type { z } from "zod";

import { addHealthRecord, addMark, updateStudentNotes } from "@/app/(app)/students/actions";
import { healthRecordSchema, markSchema } from "@/lib/validation/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="text-destructive text-xs">{message}</p> : null;
}

export function MarkForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  type Values = z.input<typeof markSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(markSchema),
    defaultValues: { studentId, subject: "", score: 0, maxScore: 100, term: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const res = await addMark(values);
    if (res.ok) {
      reset({ studentId, subject: "", score: 0, maxScore: 100, term: "" });
      router.refresh();
    } else setServerError(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
      <input type="hidden" {...register("studentId")} />
      {serverError && <p className="text-destructive text-sm sm:col-span-2">{serverError}</p>}
      <div className="space-y-1">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...register("subject")} />
        <ErrorText message={errors.subject?.message} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="term">Term</Label>
        <Input id="term" placeholder="2025-T2" {...register("term")} />
        <ErrorText message={errors.term?.message} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="score">Score</Label>
        <Input id="score" type="number" step="0.01" {...register("score")} />
        <ErrorText message={errors.score?.message} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="maxScore">Max score</Label>
        <Input id="maxScore" type="number" step="0.01" {...register("maxScore")} />
        <ErrorText message={errors.maxScore?.message} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Add mark
        </Button>
      </div>
    </form>
  );
}

export function HealthForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  type Values = z.input<typeof healthRecordSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(healthRecordSchema),
    defaultValues: { studentId, category: HealthCategory.MENTAL, summary: "", details: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const res = await addHealthRecord(values);
    if (res.ok) {
      reset({ studentId, category: HealthCategory.MENTAL, summary: "", details: "" });
      router.refresh();
    } else setServerError(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <input type="hidden" {...register("studentId")} />
      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      <div className="space-y-1">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          {...register("category")}
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          <option value={HealthCategory.MENTAL}>Mental</option>
          <option value={HealthCategory.PHYSICAL}>Physical</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="summary">Summary</Label>
        <Input id="summary" {...register("summary")} />
        <ErrorText message={errors.summary?.message} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="details">
          Details <span className="text-muted-foreground">(encrypted at rest)</span>
        </Label>
        <Textarea id="details" rows={3} {...register("details")} />
        <ErrorText message={errors.details?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Add health record
      </Button>
    </form>
  );
}

export function NotesForm({
  studentId,
  initialNotes,
}: {
  studentId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSaved(false);
    setPending(true);
    const res = await updateStudentNotes({ id: studentId, notes });
    setPending(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else setServerError(res.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      {saved && <p className="text-muted-foreground text-sm">Saved.</p>}
      <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Save notes
      </Button>
    </form>
  );
}
