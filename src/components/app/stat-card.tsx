import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export type StatAccent = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";

const ACCENTS: Record<StatAccent, string> = {
  indigo: "bg-indigo-500/10 text-indigo-500",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-500",
  sky: "bg-sky-500/10 text-sky-500",
  violet: "bg-violet-500/10 text-violet-500",
};

export interface StatTrend {
  /** Signed percentage (or absolute) delta vs the previous period. */
  value: number;
  /** Caption shown after the delta, e.g. "vs last week". */
  label?: string;
  /** When false, a positive value is treated as bad (e.g. overdue rising). */
  goodWhenUp?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "indigo",
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: StatAccent;
  trend?: StatTrend;
}) {
  const up = trend ? trend.value >= 0 : false;
  const good = trend ? (trend.goodWhenUp === false ? !up : up) : false;
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {Icon && (
            <span
              className={cn(
                "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                ACCENTS[accent],
              )}
            >
              <Icon className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                    good
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-500",
                  )}
                >
                  <TrendIcon className="size-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            <div className="text-muted-foreground truncate text-sm">{label}</div>
            {(hint || trend?.label) && (
              <div className="text-muted-foreground/80 mt-0.5 truncate text-xs">
                {trend?.label ?? hint}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
