"use client";

import { AlertTriangle, Scale } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatisticalBalance as BalanceData } from "@/lib/data/assessments";

export function StatisticalBalance({ data }: { data: BalanceData }) {
  const { t } = useT();
  const flagged = data.classrooms.filter((c) => c.inflated);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="size-4" /> {t("bal.title")}
        </CardTitle>
        <span className="text-muted-foreground text-xs">{t("bal.subtitle")}</span>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.totalAssessments === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">{t("bal.noData")}</p>
        ) : (
          <>
            {flagged.length > 0 && (
              <div className="space-y-2">
                {flagged.map((c) => (
                  <div
                    key={c.classroom}
                    className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {t("bal.inflationAlert")} — {c.classroom}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t("bal.alertSuffix")} (μ {c.oralMean}% · σ {c.oralStdDev} ·{" "}
                        {t("bal.vsWritten")} σ {c.writtenStdDev})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium">
                {t("bal.classroomCompare")}
              </p>
              {data.classrooms.map((c) => (
                <div key={c.classroom} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {c.classroom}
                      {c.inflated && <AlertTriangle className="size-3 text-amber-600" />}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {c.oralMean}% · σ {c.oralStdDev} · {c.count} {t("bal.students")}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        c.inflated ? "bg-amber-500" : "bg-indigo-500",
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, c.oralMean))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                {t("bal.criteriaCompare")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs">
                      <th className="py-1 text-start font-normal">{t("bal.classroom")}</th>
                      <th className="text-end font-normal">{t("cr.hifz")}</th>
                      <th className="text-end font-normal">{t("cr.tajweed")}</th>
                      <th className="text-end font-normal">{t("cr.makharij")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.criteria.map((c) => (
                      <tr key={c.classroom} className="border-t">
                        <td className="py-1.5">{c.classroom}</td>
                        <td className="text-end tabular-nums">{c.hifz}/4</td>
                        <td className="text-end tabular-nums">{c.tajweed}/4</td>
                        <td className="text-end tabular-nums">{c.makharij}/4</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
