import type { LucideIcon } from "lucide-react";

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

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: StatAccent;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
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
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-muted-foreground truncate text-sm">{label}</div>
          {hint && <div className="text-muted-foreground/80 mt-0.5 truncate text-xs">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
