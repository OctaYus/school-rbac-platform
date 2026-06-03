import { z } from "zod";
import { Role } from "@prisma/client";

import { emailSchema } from "@/lib/validation/auth";

const cuid = z.string().min(1).max(40);

export const inviteUserSchema = z
  .object({
    email: emailSchema,
    name: z.string().trim().min(1, "Required.").max(120),
    role: z.nativeEnum(Role),
  })
  .strict();

export const changeRoleSchema = z.object({ id: cuid, role: z.nativeEnum(Role) }).strict();

export const setActiveSchema = z.object({ id: cuid, isActive: z.boolean() }).strict();

export const userIdSchema = z.object({ id: cuid }).strict();

export const auditQuerySchema = z.object({
  actorId: cuid.optional(),
  entity: z.string().trim().max(40).optional(),
  action: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
