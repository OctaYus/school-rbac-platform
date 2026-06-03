import { z } from "zod";
import { SessionStatus } from "@prisma/client";

const cuid = z.string().min(1).max(40);

export const assignSessionSchema = z
  .object({
    teacherId: cuid,
    type: z.string().trim().min(1, "Required.").max(80),
    scheduledAt: z.coerce.date(),
    durationMin: z.coerce.number().int().min(5).max(600),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const MARKABLE_STATUSES = [
  SessionStatus.TAKEN,
  SessionStatus.MISSED,
  SessionStatus.RESCHEDULED,
  SessionStatus.CANCELLED,
] as const;

export const markSessionSchema = z
  .object({
    id: cuid,
    status: z.enum([
      SessionStatus.TAKEN,
      SessionStatus.MISSED,
      SessionStatus.RESCHEDULED,
      SessionStatus.CANCELLED,
    ]),
    scheduledAt: z.coerce.date().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((v) => v.status !== SessionStatus.RESCHEDULED || v.scheduledAt !== undefined, {
    message: "A new date/time is required to reschedule.",
    path: ["scheduledAt"],
  });

export const sessionTemplateSchema = z
  .object({
    type: z.string().trim().min(1).max(80),
    defaultDuration: z.coerce.number().int().min(5).max(600),
  })
  .strict();

export const sessionListQuerySchema = z.object({
  scope: z.enum(["upcoming", "past", "all"]).default("upcoming"),
  status: z.nativeEnum(SessionStatus).optional(),
  teacherId: cuid.optional(),
});

export type SessionListQuery = z.infer<typeof sessionListQuerySchema>;
