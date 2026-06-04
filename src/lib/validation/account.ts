import { z } from "zod";

import { emailSchema, strongPasswordSchema } from "@/lib/validation/auth";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Required.").max(120),
  })
  .strict();

export const requestEmailChangeSchema = z.object({ newEmail: emailSchema }).strict();

export const confirmEmailChangeSchema = z
  .object({
    newEmail: emailSchema,
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code."),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    newPassword: strongPasswordSchema,
  })
  .strict();
