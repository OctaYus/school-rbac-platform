"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { assertCanAssignRole, requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { generateToken, hashToken, INVITE_PREFIX, INVITE_TTL_MS } from "@/lib/auth/tokens";
import { sendInviteEmail } from "@/lib/email/mailer";
import {
  changeRoleSchema,
  inviteUserSchema,
  setActiveSchema,
  userIdSchema,
} from "@/lib/validation/admin";
import type { CurrentUser } from "@/lib/auth/session";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

/** Only OWNER may act on another OWNER account. */
function assertCanActOn(actor: CurrentUser, targetRole: Role) {
  if (targetRole === Role.OWNER && actor.role !== Role.OWNER) throw new ForbiddenError();
}

export async function inviteUser(values: unknown): Promise<ActionResult<{ inviteUrl: string }>> {
  try {
    const actor = await requireCapability(Capability.USER_MANAGE);
    const data = parse(inviteUserSchema, values);
    assertCanAssignRole(actor, data.role); // MANAGER cannot create OWNER

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail("A user with that email already exists.");

    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, role: data.role, isActive: true },
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: `${INVITE_PREFIX}${data.email}`,
        token: hashToken(token),
        expires: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    await writeAudit({
      actorId: actor.id,
      action: "user.invite",
      entity: "User",
      entityId: user.id,
      diff: { email: data.email, role: data.role },
    });

    const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${base}/accept-invite/${token}`;
    // Email the invite (no-op if SMTP unconfigured); the link is also returned
    // so the admin can copy it directly.
    await sendInviteEmail(data.email, inviteUrl);
    revalidatePath("/admin/users");
    return ok({ inviteUrl });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function setUserActive(values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireCapability(Capability.USER_MANAGE);
    const data = parse(setActiveSchema, values);
    if (data.id === actor.id) return fail("You cannot change your own account status.");

    const target = await prisma.user.findUnique({ where: { id: data.id }, select: { role: true } });
    if (!target) return fail("User not found.");
    assertCanActOn(actor, target.role);

    await prisma.user.update({
      where: { id: data.id },
      // Disabling bumps tokenVersion to force-logout existing sessions.
      data: {
        isActive: data.isActive,
        ...(data.isActive ? {} : { tokenVersion: { increment: 1 } }),
      },
    });
    await writeAudit({
      actorId: actor.id,
      action: data.isActive ? "user.enable" : "user.disable",
      entity: "User",
      entityId: data.id,
    });
    revalidatePath("/admin/users");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function changeUserRole(values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireCapability(Capability.USER_MANAGE);
    const data = parse(changeRoleSchema, values);
    if (data.id === actor.id) return fail("You cannot change your own role.");

    const target = await prisma.user.findUnique({ where: { id: data.id }, select: { role: true } });
    if (!target) return fail("User not found.");
    assertCanActOn(actor, target.role); // protect existing OWNERs
    assertCanAssignRole(actor, data.role); // protect new role assignment

    await prisma.user.update({
      where: { id: data.id },
      data: { role: data.role, tokenVersion: { increment: 1 } },
    });
    await writeAudit({
      actorId: actor.id,
      action: "user.role",
      entity: "User",
      entityId: data.id,
      diff: { role: { from: target.role, to: data.role } },
    });
    revalidatePath("/admin/users");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function forceLogoutUser(values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireCapability(Capability.USER_MANAGE);
    const data = parse(userIdSchema, values);
    await prisma.user.update({
      where: { id: data.id },
      data: { tokenVersion: { increment: 1 } },
    });
    await writeAudit({
      actorId: actor.id,
      action: "user.forceLogout",
      entity: "User",
      entityId: data.id,
    });
    revalidatePath("/admin/users");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function resetUserMfa(values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireCapability(Capability.USER_MANAGE);
    const data = parse(userIdSchema, values);
    const target = await prisma.user.findUnique({ where: { id: data.id }, select: { role: true } });
    if (!target) return fail("User not found.");
    assertCanActOn(actor, target.role);

    await prisma.$transaction([
      prisma.backupCode.deleteMany({ where: { userId: data.id } }),
      prisma.user.update({
        where: { id: data.id },
        data: { mfaSecret: null, mfaEnabled: false, tokenVersion: { increment: 1 } },
      }),
    ]);
    await writeAudit({
      actorId: actor.id,
      action: "user.resetMfa",
      entity: "User",
      entityId: data.id,
    });
    revalidatePath("/admin/users");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
