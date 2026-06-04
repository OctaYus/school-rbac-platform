"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { createTodoSchema, deleteTodoSchema, toggleTodoSchema } from "@/lib/validation/todo";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function createTodo(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(createTodoSchema, values);
    await prisma.todo.create({
      data: { userId: user.id, title: data.title, notes: data.notes, dueDate: data.dueDate },
    });
    revalidatePath("/todos");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function toggleTodo(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(toggleTodoSchema, values);
    // Ownership enforced by the userId filter — users can only touch their own.
    const result = await prisma.todo.updateMany({
      where: { id: data.id, userId: user.id },
      data: { completed: data.completed },
    });
    if (result.count === 0) return fail("Task not found.");
    revalidatePath("/todos");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteTodo(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(deleteTodoSchema, values);
    await prisma.todo.deleteMany({ where: { id: data.id, userId: user.id } });
    revalidatePath("/todos");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function clearCompletedTodos(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prisma.todo.deleteMany({ where: { userId: user.id, completed: true } });
    revalidatePath("/todos");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
