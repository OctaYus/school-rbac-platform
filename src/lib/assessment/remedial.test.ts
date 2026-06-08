import { describe, expect, it } from "vitest";
import { RubricLevel } from "@prisma/client";

import { generateRemedialPlan, weakestCriterion } from "@/lib/assessment/remedial";

describe("remedial plan generator", () => {
  it("targets the weakest criterion", () => {
    expect(
      weakestCriterion({
        hifz: RubricLevel.COMPETENT,
        tajweed: RubricLevel.BEGINNER,
        makharij: RubricLevel.DISTINGUISHED,
      }),
    ).toBe("tajweed");
  });

  it("resolves ties in hifz → tajweed → makharij order", () => {
    expect(
      weakestCriterion({
        hifz: RubricLevel.DEVELOPING,
        tajweed: RubricLevel.DEVELOPING,
        makharij: RubricLevel.DEVELOPING,
      }),
    ).toBe("hifz");
  });

  it("produces a three-tier RTI plan for the weak skill", () => {
    const plan = generateRemedialPlan(
      {
        hifz: RubricLevel.COMPETENT,
        tajweed: RubricLevel.BEGINNER,
        makharij: RubricLevel.COMPETENT,
      },
      "en",
    );
    expect(plan.focus).toBe("tajweed");
    expect(plan.tiers).toHaveLength(3);
    expect(plan.tiers.map((t) => t.tier)).toEqual([1, 2, 3]);
    expect(plan.tiers.every((t) => t.activities.length > 0)).toBe(true);
    expect(plan.durationMin).toBe(45);
  });

  it("returns localized content for Arabic", () => {
    const plan = generateRemedialPlan(
      {
        hifz: RubricLevel.BEGINNER,
        tajweed: RubricLevel.COMPETENT,
        makharij: RubricLevel.COMPETENT,
      },
      "ar",
    );
    expect(plan.focus).toBe("hifz");
    // Arabic content should not equal the English focus label.
    expect(plan.focusLabel).toBe("الحفظ");
  });
});
