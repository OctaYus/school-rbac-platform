import { z } from "zod";
import { TodoStatus } from "@prisma/client";

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

export const setTodoStatusSchema = z
  .object({ id: cuid, status: z.nativeEnum(TodoStatus) })
  .strict();

export const deleteTodoSchema = z.object({ id: cuid }).strict();
