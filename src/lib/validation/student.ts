import { z } from "zod";
import { HealthCategory, StudentStatus } from "@prisma/client";

const cuid = z.string().min(1).max(40);

export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(1, "Required.").max(120),
    externalId: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    classroom: z
      .string()
      .trim()
      .max(80)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    status: z.nativeEnum(StudentStatus).default(StudentStatus.ACTIVE),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict();

export const updateStudentSchema = createStudentSchema.extend({ id: cuid }).strict();

export const updateStatusSchema = z
  .object({ id: cuid, status: z.nativeEnum(StudentStatus) })
  .strict();

export const updateNotesSchema = z
  .object({ id: cuid, notes: z.string().trim().max(5000) })
  .strict();

export const deleteStudentSchema = z.object({ id: cuid }).strict();

export const deleteStudentsSchema = z.object({ ids: z.array(cuid).min(1).max(200) }).strict();

export const markSchema = z
  .object({
    studentId: cuid,
    subject: z.string().trim().min(1).max(80),
    score: z.coerce.number().min(0).max(999.99),
    maxScore: z.coerce.number().min(0.01).max(999.99),
    term: z.string().trim().min(1).max(40),
  })
  .strict()
  .refine((v) => v.score <= v.maxScore, {
    message: "Score cannot exceed max score.",
    path: ["score"],
  });

export const healthRecordSchema = z
  .object({
    studentId: cuid,
    category: z.nativeEnum(HealthCategory),
    summary: z.string().trim().min(1).max(200),
    details: z.string().trim().max(5000).optional(),
  })
  .strict();

// Treat empty-string query params (e.g. `?status=` from the "All statuses"
// option, or `?q=`) as absent so optional/enum fields don't reject them.
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const studentListQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(StudentStatus).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10000).default(1)),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["fullName", "createdAt", "status"]).default("fullName"),
  ),
  dir: z.preprocess(emptyToUndefined, z.enum(["asc", "desc"]).default("asc")),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
