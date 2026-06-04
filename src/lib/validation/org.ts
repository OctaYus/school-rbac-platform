import { z } from "zod";

export const updateOrgSchema = z
  .object({
    name: z.string().trim().min(2, "Organization name is required.").max(80),
  })
  .strict();
