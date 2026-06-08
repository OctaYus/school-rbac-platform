import { describe, expect, it } from "vitest";

import { analyzeBalance, analyzeClassroom, mean, stdDev } from "@/lib/assessment/statistics";

describe("descriptive statistics", () => {
  it("computes the mean", () => {
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([])).toBe(0);
  });

  it("computes population standard deviation (÷ N)", () => {
    // Classic worked example: σ = 2.
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    // Identical values → no spread.
    expect(stdDev([10, 10, 10, 10])).toBe(0);
    // Fewer than two values → 0.
    expect(stdDev([42])).toBe(0);
  });
});

describe("grade-inflation detection", () => {
  it("flags uniformly-high oral marks that contradict variable written marks", () => {
    const result = analyzeClassroom({
      classroom: "Grade 6 (B)",
      oral: [100, 100, 95, 100, 100],
      written: [60, 90, 75, 50, 85],
    });
    expect(result.inflated).toBe(true);
    expect(result.oralMean).toBeGreaterThanOrEqual(85);
    expect(result.oralStdDev).toBeLessThanOrEqual(5);
  });

  it("does not flag when oral marks themselves vary", () => {
    const result = analyzeClassroom({
      classroom: "Grade 6 (A)",
      oral: [70, 85, 90, 60, 95],
      written: [60, 90, 75, 50, 85],
    });
    expect(result.inflated).toBe(false);
  });

  it("does not flag when written marks are also uniform", () => {
    const result = analyzeClassroom({
      classroom: "Grade 5 (A)",
      oral: [100, 100, 98, 100, 99],
      written: [95, 96, 95, 97, 95],
    });
    expect(result.inflated).toBe(false);
  });

  it("does not flag below the minimum sample size", () => {
    const result = analyzeClassroom({
      classroom: "Tiny",
      oral: [100, 100],
      written: [50, 90],
    });
    expect(result.inflated).toBe(false);
  });

  it("does not flag when there is no written data to compare", () => {
    const result = analyzeClassroom({
      classroom: "Oral only",
      oral: [100, 100, 99, 100],
      written: [],
    });
    expect(result.inflated).toBe(false);
    expect(result.writtenStdDev).toBeNull();
  });

  it("sorts inflated classrooms to the top", () => {
    const balance = analyzeBalance([
      { classroom: "Clean", oral: [70, 80, 90, 60], written: [65, 85, 70, 55] },
      { classroom: "Inflated", oral: [100, 100, 95, 100, 100], written: [60, 90, 75, 50, 85] },
    ]);
    expect(balance[0].classroom).toBe("Inflated");
    expect(balance[0].inflated).toBe(true);
  });
});
