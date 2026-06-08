import "server-only";

import { prisma } from "@/lib/db";
import { analyzeBalance, type ClassroomBalance } from "@/lib/assessment/statistics";
import { RUBRIC_LEVEL_VALUE } from "@/lib/assessment/rubric";

// Label for assessments whose student has no classroom set.
export const UNASSIGNED_CLASSROOM = "—";

export interface ClassroomCriteriaAverage {
  classroom: string;
  hifz: number; // mean rubric level 1..4
  tajweed: number;
  makharij: number;
}

export interface StatisticalBalance {
  totalAssessments: number;
  classrooms: ClassroomBalance[];
  criteria: ClassroomCriteriaAverage[];
}

/**
 * Statistical balance for the whole organization: per-classroom oral/written
 * distributions (with grade-inflation flags) plus per-criterion averages for
 * the classroom-comparison chart. Org-scoped — multi-tenant safe.
 */
export async function getStatisticalBalance(organizationId: string): Promise<StatisticalBalance> {
  const rows = await prisma.oralAssessment.findMany({
    where: { organizationId },
    select: {
      oralScore: true,
      writtenScore: true,
      hifz: true,
      tajweed: true,
      makharij: true,
      student: { select: { classroom: true } },
    },
  });

  interface Bucket {
    oral: number[];
    written: number[];
    hifz: number[];
    tajweed: number[];
    makharij: number[];
  }
  const byClass = new Map<string, Bucket>();
  for (const r of rows) {
    const key = r.student.classroom?.trim() || UNASSIGNED_CLASSROOM;
    const g = byClass.get(key) ?? { oral: [], written: [], hifz: [], tajweed: [], makharij: [] };
    g.oral.push(Number(r.oralScore));
    if (r.writtenScore !== null) g.written.push(Number(r.writtenScore));
    g.hifz.push(RUBRIC_LEVEL_VALUE[r.hifz]);
    g.tajweed.push(RUBRIC_LEVEL_VALUE[r.tajweed]);
    g.makharij.push(RUBRIC_LEVEL_VALUE[r.makharij]);
    byClass.set(key, g);
  }

  const classrooms = analyzeBalance(
    [...byClass.entries()].map(([classroom, g]) => ({
      classroom,
      oral: g.oral,
      written: g.written,
    })),
  );

  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : 0;
  const criteria = [...byClass.entries()]
    .map(([classroom, g]) => ({
      classroom,
      hifz: avg(g.hifz),
      tajweed: avg(g.tajweed),
      makharij: avg(g.makharij),
    }))
    .sort((a, b) => a.classroom.localeCompare(b.classroom));

  return { totalAssessments: rows.length, classrooms, criteria };
}
