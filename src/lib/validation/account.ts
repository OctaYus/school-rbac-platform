import { z } from "zod";

import { strongPasswordSchema } from "@/lib/validation/auth";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Required.").max(120),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    newPassword: strongPasswordSchema,
  })
  .strict();
