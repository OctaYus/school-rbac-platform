/**
 * Statistical balance engine for "Mizan Al-Farooq".
 *
 * Pure functions (no I/O) so they are unit-testable. The dashboard feeds these
 * per-classroom oral and written scores; the engine surfaces grade inflation —
 * a classroom where oral marks are uniformly high (standard deviation ≈ 0)
 * while the matching written-theory marks show normal variance.
 */

/** Arithmetic mean. Returns 0 for an empty set. */
export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Population standard deviation σ = sqrt( Σ(xᵢ − μ)² / N ) — matches the formula
 * in the project spec (divides by N, not N−1). Returns 0 for < 2 values.
 */
export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mu = mean(xs);
  const variance = xs.reduce((acc, x) => acc + (x - mu) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

// Tuning thresholds for the grade-inflation heuristic. Scores are 0–100.
export const INFLATION = {
  /** Need at least this many graded students to judge a classroom. */
  MIN_SAMPLE: 4,
  /** Oral marks this tightly clustered are "uniform". */
  ORAL_STDDEV_MAX: 5,
  /** …and only suspicious when the marks are also high. */
  ORAL_MEAN_MIN: 85,
  /** Written marks must show real spread for the mismatch to count. */
  WRITTEN_STDDEV_MIN: 8,
} as const;

export interface ClassroomScores {
  classroom: string;
  /** Oral (rubric-derived) percentages for each graded student. */
  oral: number[];
  /** Matching written-theory percentages (only students who have one). */
  written: number[];
}

export interface ClassroomBalance {
  classroom: string;
  count: number;
  oralMean: number;
  oralStdDev: number;
  writtenMean: number | null;
  writtenStdDev: number | null;
  /** True when uniformly-high oral marks contradict variable written marks. */
  inflated: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Analyse one classroom's grade distribution. */
export function analyzeClassroom(input: ClassroomScores): ClassroomBalance {
  const oralMean = mean(input.oral);
  const oralStdDev = stdDev(input.oral);
  const hasWritten = input.written.length >= INFLATION.MIN_SAMPLE;
  const writtenMean = hasWritten ? mean(input.written) : null;
  const writtenStdDev = hasWritten ? stdDev(input.written) : null;

  const inflated =
    input.oral.length >= INFLATION.MIN_SAMPLE &&
    oralStdDev <= INFLATION.ORAL_STDDEV_MAX &&
    oralMean >= INFLATION.ORAL_MEAN_MIN &&
    writtenStdDev !== null &&
    writtenStdDev >= INFLATION.WRITTEN_STDDEV_MIN;

  return {
    classroom: input.classroom,
    count: input.oral.length,
    oralMean: round2(oralMean),
    oralStdDev: round2(oralStdDev),
    writtenMean: writtenMean === null ? null : round2(writtenMean),
    writtenStdDev: writtenStdDev === null ? null : round2(writtenStdDev),
    inflated,
  };
}

/** Analyse every classroom, inflated ones first, then by name. */
export function analyzeBalance(inputs: ClassroomScores[]): ClassroomBalance[] {
  return inputs
    .map(analyzeClassroom)
    .sort((a, b) =>
      a.inflated === b.inflated ? a.classroom.localeCompare(b.classroom) : a.inflated ? -1 : 1,
    );
}
