"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, isPasswordBreached, verifyPassword } from "@/lib/auth/password";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validation/account";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function updateProfile(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(updateProfileSchema, values);

    await prisma.user.update({ where: { id: user.id }, data: { name: data.name } });
    await writeAudit({
      actorId: user.id,
      action: "user.profile.update",
      entity: "User",
      entityId: user.id,
      diff: { name: { from: user.name, to: data.name } },
    });
    revalidatePath("/account");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function changePassword(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(changePasswordSchema, values);

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (
      !record?.passwordHash ||
      !(await verifyPassword(record.passwordHash, data.currentPassword))
    ) {
      return fail("Your current password is incorrect.");
    }
    if (await isPasswordBreached(data.newPassword)) {
      return fail("That password has appeared in a data breach. Choose a different one.");
    }

    const passwordHash = await hashPassword(data.newPassword);
    // Bump tokenVersion to invalidate all existing sessions (incl. this one).
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    await writeAudit({
      actorId: user.id,
      action: "user.password.change",
      entity: "User",
      entityId: user.id,
    });
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
