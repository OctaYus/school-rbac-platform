"use client";

import type { SessionStatus, StudentStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { SESSION_STATUS_KEY, STUDENT_STATUS_KEY } from "@/lib/i18n/enum-labels";

const PILL =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

const COLORS = {
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25",
  zinc: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-400/25",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/25",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/25",
  indigo:
    "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/25",
} as const;

type Color = keyof typeof COLORS;

const STUDENT: Record<StudentStatus, Color> = {
  ACTIVE: "emerald",
  INACTIVE: "zinc",
  GRADUATED: "sky",
  SUSPENDED: "rose",
  ARCHIVED: "amber",
};

const SESSION: Record<SessionStatus, Color> = {
  SCHEDULED: "indigo",
  TAKEN: "emerald",
  MISSED: "rose",
  RESCHEDULED: "amber",
  CANCELLED: "zinc",
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const { t } = useT();
  return <span className={cn(PILL, COLORS[STUDENT[status]])}>{t(STUDENT_STATUS_KEY[status])}</span>;
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { t } = useT();
  return <span className={cn(PILL, COLORS[SESSION[status]])}>{t(SESSION_STATUS_KEY[status])}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useT();
  return (
    <span className={cn(PILL, COLORS[active ? "emerald" : "rose"])}>
      {t(active ? "common.active" : "common.disabled")}
    </span>
  );
}
