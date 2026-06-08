import { RubricLevel } from "@prisma/client";

/**
 * "Mizan Al-Farooq" analytical rubric for Qur'anic oral assessment.
 *
 * Pure, dependency-free scoring so it can be unit-tested and imported anywhere
 * (server actions, client form preview, dashboard aggregation). Three criteria
 * — memorization (Hifz), tajweed rules (Ghunnah/Mad) and articulation
 * (Makharij) — each scored on a four-level descriptor scale.
 */

export const RUBRIC_LEVEL_VALUE: Record<RubricLevel, number> = {
  BEGINNER: 1,
  DEVELOPING: 2,
  COMPETENT: 3,
  DISTINGUISHED: 4,
};

export const RUBRIC_LEVELS = [
  RubricLevel.BEGINNER,
  RubricLevel.DEVELOPING,
  RubricLevel.COMPETENT,
  RubricLevel.DISTINGUISHED,
] as const;

export const RUBRIC_CRITERIA = ["hifz", "tajweed", "makharij"] as const;
export type RubricCriterion = (typeof RUBRIC_CRITERIA)[number];

export interface RubricLevels {
  hifz: RubricLevel;
  tajweed: RubricLevel;
  makharij: RubricLevel;
}

// Highest attainable raw points: 3 criteria × level 4.
export const RUBRIC_MAX_POINTS = RUBRIC_CRITERIA.length * 4;

/** Raw points (3..12) for a set of rubric levels. */
export function rubricPoints(levels: RubricLevels): number {
  return (
    RUBRIC_LEVEL_VALUE[levels.hifz] +
    RUBRIC_LEVEL_VALUE[levels.tajweed] +
    RUBRIC_LEVEL_VALUE[levels.makharij]
  );
}

/**
 * Equivalent grade as a 0–100 percentage, rounded to 2 decimals. Removes
 * subjectivity: the teacher selects descriptors, the grade is derived.
 */
export function computeOralScore(levels: RubricLevels): number {
  const pct = (rubricPoints(levels) / RUBRIC_MAX_POINTS) * 100;
  return Math.round(pct * 100) / 100;
}
