"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { SessionStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { SESSION_STATUS_KEY } from "@/lib/i18n/enum-labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCard({
  title,
  href,
  linkLabel,
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useT();
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {href && (
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            {linkLabel ?? t("common.viewAll")} <ArrowRight className="size-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export interface SessionItem {
  id: string;
  type: string;
  scheduledAt: Date;
  durationMin: number;
  sub?: string;
  status?: string;
}

const SESSION_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> =
  {
    SCHEDULED: "default",
    TAKEN: "secondary",
    MISSED: "destructive",
    RESCHEDULED: "outline",
    CANCELLED: "secondary",
  };

export function SessionList({ items, empty }: { items: SessionItem[]; empty: string }) {
  const { t } = useT();
  if (items.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>;
  }
  return (
    <ul className="divide-y">
      {items.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-2.5">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 flex-col items-center justify-center rounded-lg">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{s.type}</div>
            <div className="text-muted-foreground truncate text-xs">
              {format(s.scheduledAt, "EEE, MMM d · p")} · {s.durationMin} {t("sessions.min")}
              {s.sub ? ` · ${s.sub}` : ""}
            </div>
          </div>
          {s.status && (
            <Badge variant={SESSION_STATUS_VARIANT[s.status] ?? "secondary"}>
              {t(SESSION_STATUS_KEY[s.status as SessionStatus])}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface BarEntry {
  label: string;
  value: number;
  color: string; // tailwind bg-* class
}

export function BarBreakdown({ entries }: { entries: BarEntry[] }) {
  const { t } = useT();
  const total = entries.reduce((a, b) => a + b.value, 0) || 1;
  if (entries.every((e) => e.value === 0)) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t("common.noData")}</p>;
  }
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{e.label}</span>
            <span className="font-medium">{e.value}</span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", e.color)}
              style={{ width: `${Math.round((e.value / total) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({
  items,
}: {
  items: { id: string; actorName: string; action: string; createdAt: Date }[];
}) {
  const { t } = useT();
  if (items.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{t("dash.noActivity")}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-3">
          <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium">{a.actorName}</span>{" "}
              <span className="text-muted-foreground">{a.action}</span>
            </p>
            <p className="text-muted-foreground/80 text-xs">
              {formatDistanceToNow(a.createdAt, { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompletionRow({
  name,
  taken,
  total,
  rate,
}: {
  name: string;
  taken: number;
  total: number;
  rate: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="text-muted-foreground text-xs">
          {taken}/{total} · {rate}%
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
