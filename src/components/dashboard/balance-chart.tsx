"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useT } from "@/components/i18n-provider";

export interface BalanceChartRow {
  classroom: string;
  oral: number;
  written: number | null;
  inflated: boolean;
}

/**
 * Grouped bar chart comparing each classroom's average oral (recitation) grade
 * against its average written (theory) grade. A tall oral bar next to a short
 * written bar is the visual signature of grade inflation; inflated classrooms'
 * oral bars are drawn in amber.
 */
export function BalanceChart({ rows }: { rows: BalanceChartRow[] }) {
  const { t } = useT();
  const data = rows.map((r) => ({
    classroom: r.classroom,
    oral: r.oral,
    written: r.written ?? 0,
    inflated: r.inflated,
  }));

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
          <XAxis dataKey="classroom" tick={{ fontSize: 12 }} stroke="currentColor" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="currentColor" />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar name={t("assess.oral")} dataKey="oral" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.inflated ? "#f59e0b" : "#6366f1"} />
            ))}
          </Bar>
          <Bar name={t("assess.written")} dataKey="written" radius={[4, 4, 0, 0]} fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
