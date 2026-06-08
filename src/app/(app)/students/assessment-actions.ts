"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireCapability, assertStudentAccess } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import { computeOralScore } from "@/lib/assessment/rubric";
import {
  createOralAssessmentSchema,
  deleteOralAssessmentSchema,
  updateOralAssessmentSchema,
} from "@/lib/validation/assessment";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function createOralAssessment(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(createOralAssessmentSchema, values);
    await assertStudentAccess(user, data.studentId);

    const oralScore = computeOralScore(data);
    const assessment = await prisma.oralAssessment.create({
      data: {
        organizationId: user.organizationId,
        studentId: data.studentId,
        surah: data.surah,
        hifz: data.hifz,
        tajweed: data.tajweed,
        makharij: data.makharij,
        oralScore,
        writtenScore: data.writtenScore ?? null,
        recordedById: user.id,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "assessment.create",
      entity: "OralAssessment",
      entityId: assessment.id,
      diff: { studentId: data.studentId, surah: data.surah, oralScore },
    });
    revalidatePath(`/students/${data.studentId}`);
    return ok({ id: assessment.id });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateOralAssessment(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(updateOralAssessmentSchema, values);

    const before = await prisma.oralAssessment.findFirst({
      where: { id: data.id, organizationId: user.organizationId },
    });
    if (!before) return fail("Assessment not found.");
    await assertStudentAccess(user, before.studentId);

    const oralScore = computeOralScore(data);
    await prisma.oralAssessment.update({
      where: { id: data.id },
      data: {
        surah: data.surah,
        hifz: data.hifz,
        tajweed: data.tajweed,
        makharij: data.makharij,
        oralScore,
        writtenScore: data.writtenScore ?? null,
      },
    });
    // Grade changes are logged with the mandatory pedagogical justification.
    await writeAudit({
      actorId: user.id,
      action: "assessment.update",
      entity: "OralAssessment",
      entityId: data.id,
      diff: {
        studentId: before.studentId,
        oralScore: { from: Number(before.oralScore), to: oralScore },
        reason: data.reason,
      },
    });
    revalidatePath(`/students/${before.studentId}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteOralAssessment(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(deleteOralAssessmentSchema, values);

    const before = await prisma.oralAssessment.findFirst({
      where: { id: data.id, organizationId: user.organizationId },
    });
    if (!before) return fail("Assessment not found.");
    await assertStudentAccess(user, before.studentId);

    await prisma.oralAssessment.delete({ where: { id: data.id } });
    await writeAudit({
      actorId: user.id,
      action: "assessment.delete",
      entity: "OralAssessment",
      entityId: data.id,
      diff: {
        studentId: before.studentId,
        oralScore: Number(before.oralScore),
        reason: data.reason,
      },
    });
    revalidatePath(`/students/${before.studentId}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
