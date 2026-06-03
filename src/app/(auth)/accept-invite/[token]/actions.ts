"use server";

import type { z } from "zod";

import { prisma } from "@/lib/db";
import { hashPassword, isPasswordBreached } from "@/lib/auth/password";
import { hashToken, INVITE_PREFIX } from "@/lib/auth/tokens";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { passwordResetLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import { acceptInviteSchema } from "@/lib/validation/auth";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

/**
 * Consume an invite token and set the user's name + password.
 * Token is looked up by its SHA-256 hash, must be unexpired, and is deleted on
 * use (single-use). Password is checked against the breach corpus.
 */
export async function acceptInvite(values: unknown): Promise<ActionResult> {
  try {
    const data = parse(acceptInviteSchema, values);

    const ip = await getClientIp();
    const rl = await passwordResetLimiter.limit(`accept-invite:${ip}`);
    if (!rl.success) return fail("Too many attempts. Please try again later.");

    const record = await prisma.verificationToken.findUnique({
      where: { token: hashToken(data.token) },
    });
    if (!record || !record.identifier.startsWith(INVITE_PREFIX) || record.expires < new Date()) {
      return fail("This invite link is invalid or has expired.");
    }
    const email = record.identifier.slice(INVITE_PREFIX.length);

    if (await isPasswordBreached(data.password)) {
      return fail("That password has appeared in a data breach. Choose a different one.");
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return fail("This invite link is invalid.");

    const passwordHash = await hashPassword(data.password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          passwordHash,
          isActive: true,
          tokenVersion: { increment: 1 },
        },
      }),
      prisma.verificationToken.delete({ where: { token: record.token } }),
    ]);

    await writeAudit({
      actorId: user.id,
      action: "user.acceptInvite",
      entity: "User",
      entityId: user.id,
    });
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
