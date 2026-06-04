import { z } from "zod";

const cuid = z.string().min(1).max(40);

export const createTodoSchema = z
  .object({
    title: z.string().trim().min(1, "Required.").max(200),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    dueDate: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined))
      .refine((v) => v === undefined || !Number.isNaN(v.getTime()), "Invalid date."),
  })
  .strict();

export const toggleTodoSchema = z.object({ id: cuid, completed: z.boolean() }).strict();
export const deleteTodoSchema = z.object({ id: cuid }).strict();
