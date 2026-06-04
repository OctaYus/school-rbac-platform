"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, isPasswordBreached, verifyPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { sendOtpEmail, smtpConfigured } from "@/lib/email/mailer";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { passwordResetLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import {
  changePasswordSchema,
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  updateProfileSchema,
} from "@/lib/validation/account";

const EMAIL_CHANGE_PREFIX = "email-change:";
const OTP_TTL_MS = 10 * 60 * 1000;

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

/**
 * Step 1 of an email change: email a 6-digit OTP to the NEW address.
 * The code is stored hashed, single-use, 10-min TTL, bound to userId+newEmail.
 */
export async function requestEmailChange(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(requestEmailChangeSchema, values);

    if (!smtpConfigured()) {
      return fail("Email isn't configured yet, so a code can't be sent. Try again later.");
    }
    if (data.newEmail === user.email) {
      return fail("That's already your email address.");
    }

    const ip = await getClientIp();
    const rl = await passwordResetLimiter.limit(`email-change:${user.id}:${ip}`);
    if (!rl.success) return fail("Too many requests. Please try again later.");

    const taken = await prisma.user.findUnique({ where: { email: data.newEmail } });
    if (taken) return fail("That email address is already in use.");

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.verificationToken.deleteMany({
      where: { identifier: { startsWith: `${EMAIL_CHANGE_PREFIX}${user.id}:` } },
    });
    await prisma.verificationToken.create({
      data: {
        identifier: `${EMAIL_CHANGE_PREFIX}${user.id}:${data.newEmail}`,
        token: hashToken(code),
        expires: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const sent = await sendOtpEmail(data.newEmail, code);
    if (!sent) return fail("Couldn't send the verification email. Please try again.");

    await writeAudit({
      actorId: user.id,
      action: "user.email.requestChange",
      entity: "User",
      entityId: user.id,
      diff: { to: data.newEmail },
    });
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

/** Step 2: verify the OTP and apply the new email (invalidates sessions). */
export async function confirmEmailChange(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = parse(confirmEmailChangeSchema, values);

    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `${EMAIL_CHANGE_PREFIX}${user.id}:${data.newEmail}`,
          token: hashToken(data.code),
        },
      },
    });
    if (!record || record.expires < new Date()) {
      return fail("That code is invalid or has expired.");
    }

    const taken = await prisma.user.findUnique({ where: { email: data.newEmail } });
    if (taken) return fail("That email address is already in use.");

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { email: data.newEmail, tokenVersion: { increment: 1 } },
      }),
      prisma.verificationToken.delete({ where: { token: record.token } }),
    ]);
    await writeAudit({
      actorId: user.id,
      action: "user.email.change",
      entity: "User",
      entityId: user.id,
      diff: { from: user.email, to: data.newEmail },
    });
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
