"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { RubricLevel } from "@prisma/client";

import {
  createOralAssessment,
  deleteOralAssessment,
  updateOralAssessment,
} from "@/app/(app)/students/assessment-actions";
import {
  computeOralScore,
  RUBRIC_CRITERIA,
  RUBRIC_LEVELS,
  type RubricLevels,
} from "@/lib/assessment/rubric";
import { generateRemedialPlan } from "@/lib/assessment/remedial";
import { CRITERION_KEY, RUBRIC_LEVEL_KEY } from "@/lib/i18n/enum-labels";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AssessmentItem {
  id: string;
  surah: string;
  hifz: RubricLevel;
  tajweed: RubricLevel;
  makharij: RubricLevel;
  oralScore: number;
  writtenScore: number | null;
  recordedAt: Date;
  updatedAt: Date;
}

const DEFAULT_LEVELS: RubricLevels = {
  hifz: RubricLevel.COMPETENT,
  tajweed: RubricLevel.COMPETENT,
  makharij: RubricLevel.COMPETENT,
};

function gradeTone(score: number): string {
  if (score >= 85) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (score >= 60) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
}

/** Three criteria × four descriptor buttons. */
function RubricPicker({
  value,
  onChange,
}: {
  value: RubricLevels;
  onChange: (next: RubricLevels) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-3">
      {RUBRIC_CRITERIA.map((c) => (
        <div key={c} className="space-y-1.5">
          <Label>{t(CRITERION_KEY[c])}</Label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {RUBRIC_LEVELS.map((lvl) => {
              const active = value[c] === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, [c]: lvl })}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-muted",
                  )}
                >
                  {t(RUBRIC_LEVEL_KEY[lvl])}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function GradePreview({ levels }: { levels: RubricLevels }) {
  const { t } = useT();
  const score = computeOralScore(levels);
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
      <span className="text-muted-foreground text-sm">{t("assess.computedGrade")}</span>
      <span className={cn("rounded-md px-2 py-0.5 text-sm font-semibold", gradeTone(score))}>
        {score}%
      </span>
    </div>
  );
}

export function NewAssessmentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [levels, setLevels] = useState<RubricLevels>(DEFAULT_LEVELS);
  const [surah, setSurah] = useState("");
  const [written, setWritten] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await createOralAssessment({
      studentId,
      surah,
      ...levels,
      writtenScore: written === "" ? undefined : written,
    });
    setPending(false);
    if (res.ok) {
      setSurah("");
      setWritten("");
      setLevels(DEFAULT_LEVELS);
      router.refresh();
    } else setError(res.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="space-y-1">
        <Label htmlFor="surah">{t("assess.surah")}</Label>
        <Input
          id="surah"
          value={surah}
          onChange={(e) => setSurah(e.target.value)}
          placeholder={t("assess.surahPlaceholder")}
        />
      </div>
      <RubricPicker value={levels} onChange={setLevels} />
      <div className="space-y-1">
        <Label htmlFor="written">{t("assess.writtenScore")}</Label>
        <Input
          id="written"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={written}
          onChange={(e) => setWritten(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("assess.writtenHint")}</p>
      </div>
      <GradePreview levels={levels} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {t("assess.save")}
      </Button>
    </form>
  );
}

function ReviseDialog({ item }: { item: AssessmentItem }) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<RubricLevels>({
    hifz: item.hifz,
    tajweed: item.tajweed,
    makharij: item.makharij,
  });
  const [surah, setSurah] = useState(item.surah);
  const [written, setWritten] = useState(
    item.writtenScore === null ? "" : String(item.writtenScore),
  );
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await updateOralAssessment({
      id: item.id,
      surah,
      ...levels,
      writtenScore: written === "" ? undefined : written,
      reason,
    });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      setReason("");
      router.refresh();
    } else setError(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" /> {t("assess.revise")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("assess.reviseTitle")}</DialogTitle>
          <DialogDescription>{item.surah}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-1">
            <Label htmlFor={`surah-${item.id}`}>{t("assess.surah")}</Label>
            <Input
              id={`surah-${item.id}`}
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
            />
          </div>
          <RubricPicker value={levels} onChange={setLevels} />
          <div className="space-y-1">
            <Label htmlFor={`written-${item.id}`}>{t("assess.writtenScore")}</Label>
            <Input
              id={`written-${item.id}`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={written}
              onChange={(e) => setWritten(e.target.value)}
            />
          </div>
          <GradePreview levels={levels} />
          <div className="space-y-1">
            <Label htmlFor={`reason-${item.id}`}>{t("assess.reason")}</Label>
            <Textarea
              id={`reason-${item.id}`}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("assess.reasonHint")}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAssessmentDialog({ item }: { item: AssessmentItem }) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await deleteOralAssessment({ id: item.id, reason });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setError(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assess.deleteTitle")}</DialogTitle>
          <DialogDescription>{item.surah}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onConfirm} className="space-y-3" noValidate>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-1">
            <Label htmlFor={`del-reason-${item.id}`}>{t("assess.reason")}</Label>
            <Textarea
              id={`del-reason-${item.id}`}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("assess.reasonHint")}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemedialPlanDialog({ item }: { item: AssessmentItem }) {
  const { t, locale } = useT();
  const plan = generateRemedialPlan(
    { hifz: item.hifz, tajweed: item.tajweed, makharij: item.makharij },
    locale,
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400">
          <Sparkles className="size-4" /> {t("assess.remedial")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" /> {t("assess.remedialTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("assess.remedialFocus")}: <span className="font-medium">{plan.focusLabel}</span> ·{" "}
            {t(RUBRIC_LEVEL_KEY[plan.level])} · {t("assess.remedialDuration")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="rounded-md border border-violet-500/30 bg-violet-500/10 p-2.5 text-xs">
            {t("assess.remedialDraftNotice")}
          </p>
          {plan.tiers.map((tier) => (
            <div key={tier.tier} className="rounded-md border p-3">
              <p className="mb-1.5 text-sm font-semibold">{tier.title}</p>
              <ul className="list-disc space-y-1 ps-5 text-sm">
                {tier.activities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentTable({ items }: { items: AssessmentItem[] }) {
  const { t } = useT();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("assess.surah")}</TableHead>
            <TableHead className="text-right">{t("assess.oral")}</TableHead>
            <TableHead className="text-right">{t("assess.written")}</TableHead>
            <TableHead className="text-right">{t("students.recorded")}</TableHead>
            <TableHead className="text-right">{t("sessions.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                {a.surah}
                {a.updatedAt.getTime() - a.recordedAt.getTime() > 1000 && (
                  <Badge variant="outline" className="ms-2 align-middle text-[10px]">
                    {t("assess.revisedBadge")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    gradeTone(a.oralScore),
                  )}
                >
                  {a.oralScore}%
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {a.writtenScore === null ? "—" : `${a.writtenScore}%`}
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {format(a.recordedAt, "PP")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <RemedialPlanDialog item={a} />
                  <ReviseDialog item={a} />
                  <DeleteAssessmentDialog item={a} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function OralAssessmentPanel({
  studentId,
  items,
}: {
  studentId: string;
  items: AssessmentItem[];
}) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("assess.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAssessmentForm studentId={studentId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("assess.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("assess.none")}</p>
          ) : (
            <AssessmentTable items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
