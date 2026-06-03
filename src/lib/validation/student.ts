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

export const studentListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.nativeEnum(StudentStatus).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  sort: z.enum(["fullName", "createdAt", "status"]).default("fullName"),
  dir: z.enum(["asc", "desc"]).default("asc"),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
