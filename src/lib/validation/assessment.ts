import { z } from "zod";
import { RubricLevel } from "@prisma/client";

const cuid = z.string().min(1).max(40);

// Mandatory pedagogical justification for any change to an existing grade
// (Assessment Integrity Charter): edits/deletes must carry a reason.
const reason = z.string().trim().min(5, "A pedagogical reason is required.").max(500);

const rubricLevel = z.nativeEnum(RubricLevel);

const writtenScore = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(0).max(100).optional(),
  )
  .optional();

export const createOralAssessmentSchema = z
  .object({
    studentId: cuid,
    surah: z.string().trim().min(1, "Required.").max(120),
    hifz: rubricLevel,
    tajweed: rubricLevel,
    makharij: rubricLevel,
    writtenScore,
  })
  .strict();

export const updateOralAssessmentSchema = z
  .object({
    id: cuid,
    surah: z.string().trim().min(1, "Required.").max(120),
    hifz: rubricLevel,
    tajweed: rubricLevel,
    makharij: rubricLevel,
    writtenScore,
    reason,
  })
  .strict();

export const deleteOralAssessmentSchema = z.object({ id: cuid, reason }).strict();

export type CreateOralAssessmentInput = z.infer<typeof createOralAssessmentSchema>;
export type UpdateOralAssessmentInput = z.infer<typeof updateOralAssessmentSchema>;
