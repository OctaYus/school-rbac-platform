import { z } from "zod";

import { emailSchema, strongPasswordSchema } from "@/lib/validation/auth";

export const signupSchema = z
  .object({
    orgName: z.string().trim().min(2, "Organization name is required.").max(80),
    name: z.string().trim().min(1, "Your name is required.").max(120),
    email: emailSchema,
    password: strongPasswordSchema,
  })
  .strict();
