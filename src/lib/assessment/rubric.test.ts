import { describe, expect, it } from "vitest";
import { RubricLevel } from "@prisma/client";

import { computeOralScore, rubricPoints, RUBRIC_MAX_POINTS } from "@/lib/assessment/rubric";

describe("rubric scoring", () => {
  it("maps a perfect rubric to 100%", () => {
    expect(
      computeOralScore({
        hifz: RubricLevel.DISTINGUISHED,
        tajweed: RubricLevel.DISTINGUISHED,
        makharij: RubricLevel.DISTINGUISHED,
      }),
    ).toBe(100);
  });

  it("maps an all-beginner rubric to 25%", () => {
    expect(
      computeOralScore({
        hifz: RubricLevel.BEGINNER,
        tajweed: RubricLevel.BEGINNER,
        makharij: RubricLevel.BEGINNER,
      }),
    ).toBe(25);
  });

  it("derives the equivalent grade from mixed descriptors", () => {
    // (1 + 2 + 3) / 12 * 100 = 50
    expect(
      computeOralScore({
        hifz: RubricLevel.BEGINNER,
        tajweed: RubricLevel.DEVELOPING,
        makharij: RubricLevel.COMPETENT,
      }),
    ).toBe(50);
  });

  it("sums raw points and caps at the max", () => {
    expect(RUBRIC_MAX_POINTS).toBe(12);
    expect(
      rubricPoints({
        hifz: RubricLevel.COMPETENT,
        tajweed: RubricLevel.COMPETENT,
        makharij: RubricLevel.COMPETENT,
      }),
    ).toBe(9);
  });
});
