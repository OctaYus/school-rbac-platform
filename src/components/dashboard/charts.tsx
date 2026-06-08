"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useT } from "@/components/i18n-provider";

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
} as const;

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

/** Donut chart of students by status (CRM-style distribution widget). */
export function StatusDonut({ data }: { data: DonutDatum[] }) {
  const { t } = useT();
  const slices = data.filter((d) => d.value > 0);
  if (slices.length === 0) {
    return <p className="text-muted-foreground py-10 text-center text-sm">{t("common.noData")}</p>;
  }
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {slices.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DayPoint {
  label: string;
  taken: number;
  total: number;
}

/** Area chart of session activity over the last 7 days. */
export function WeeklyActivityChart({ data }: { data: DayPoint[] }) {
  const { t } = useT();
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="takenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="currentColor" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            name={t("dash.totalLabel")}
            dataKey="total"
            stroke="#a5b4fc"
            fill="url(#totalGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            name={t("ss.TAKEN")}
            dataKey="taken"
            stroke="#6366f1"
            fill="url(#takenGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
