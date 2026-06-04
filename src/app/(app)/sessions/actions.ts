"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { Role, SessionStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { assertSessionOwnership, requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { sessionActionLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import {
  assignSessionSchema,
  deleteSessionSchema,
  markSessionSchema,
  sessionTemplateSchema,
} from "@/lib/validation/session";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function assignSession(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCapability(Capability.SESSION_ASSIGN);
    const data = parse(assignSessionSchema, values);

    const teacher = await prisma.user.findFirst({
      where: { id: data.teacherId, organizationId: user.organizationId },
      select: { id: true, role: true, isActive: true },
    });
    if (!teacher || !teacher.isActive || teacher.role !== Role.TEACHER) {
      return fail("Select a valid, active teacher.");
    }

    const session = await prisma.session.create({
      data: {
        organizationId: user.organizationId,
        teacherId: data.teacherId,
        assignedById: user.id,
        type: data.type,
        scheduledAt: data.scheduledAt,
        durationMin: data.durationMin,
        notes: data.notes,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "session.assign",
      entity: "Session",
      entityId: session.id,
      diff: {
        teacherId: data.teacherId,
        type: data.type,
        scheduledAt: data.scheduledAt.toISOString(),
      },
    });
    revalidatePath("/sessions");
    return ok({ id: session.id });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function markSession(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.SESSION_MARK);
    const data = parse(markSessionSchema, values);

    const ip = await getClientIp();
    const rl = await sessionActionLimiter.limit(`session-mark:${user.id}:${ip}`);
    if (!rl.success) return fail("Too many updates. Please slow down.");

    // Teachers may only modify their own sessions.
    await assertSessionOwnership(user, data.id);

    const before = await prisma.session.findUnique({
      where: { id: data.id },
      select: { status: true, scheduledAt: true },
    });
    if (!before) return fail("Session not found.");

    await prisma.session.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        scheduledAt: data.scheduledAt ?? undefined,
        takenAt: data.status === SessionStatus.TAKEN ? new Date() : null,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "session.mark",
      entity: "Session",
      entityId: data.id,
      diff: {
        status: { from: before.status, to: data.status },
        ...(data.scheduledAt
          ? {
              scheduledAt: {
                from: before.scheduledAt.toISOString(),
                to: data.scheduledAt.toISOString(),
              },
            }
          : {}),
      },
    });
    revalidatePath("/sessions");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteSession(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.SESSION_ASSIGN);
    const data = parse(deleteSessionSchema, values);

    const existing = await prisma.session.findFirst({
      where: { id: data.id, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) return fail("Session not found.");

    await prisma.session.delete({ where: { id: data.id } });
    await writeAudit({
      actorId: user.id,
      action: "session.delete",
      entity: "Session",
      entityId: data.id,
    });
    revalidatePath("/sessions");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function createSessionTemplate(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.SESSION_TEMPLATE_CREATE);
    const data = parse(sessionTemplateSchema, values);

    const existing = await prisma.sessionTemplate.findFirst({
      where: { organizationId: user.organizationId, type: data.type },
    });
    if (existing) return fail("A template with that type already exists.");

    const template = await prisma.sessionTemplate.create({
      data: {
        organizationId: user.organizationId,
        type: data.type,
        defaultDuration: data.defaultDuration,
        createdById: user.id,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "session.template.create",
      entity: "SessionTemplate",
      entityId: template.id,
      diff: { type: data.type, defaultDuration: data.defaultDuration },
    });
    revalidatePath("/sessions/assign");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
