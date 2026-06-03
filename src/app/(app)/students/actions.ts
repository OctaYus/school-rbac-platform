"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireCapability, assertStudentAccess } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { computeDiff, redact, writeAudit } from "@/lib/audit";
import { encryptNullable } from "@/lib/security/crypto";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, fail, handleActionError, ok } from "@/lib/action-result";
import {
  createStudentSchema,
  deleteStudentSchema,
  deleteStudentsSchema,
  healthRecordSchema,
  markSchema,
  updateNotesSchema,
  updateStatusSchema,
  updateStudentSchema,
} from "@/lib/validation/student";

const HEALTH_AAD = "healthrecord";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function createStudent(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCapability(Capability.STUDENT_WRITE);
    const data = parse(createStudentSchema, values);

    const student = await prisma.student.create({
      data: {
        fullName: data.fullName,
        externalId: data.externalId,
        status: data.status,
        notes: data.notes,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "student.create",
      entity: "Student",
      entityId: student.id,
      diff: { fullName: student.fullName, status: student.status },
    });
    revalidatePath("/students");
    return ok({ id: student.id });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateStudent(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_WRITE);
    const data = parse(updateStudentSchema, values);
    await assertStudentAccess(user, data.id);

    const before = await prisma.student.findUnique({ where: { id: data.id } });
    if (!before) return fail("Student not found.");

    const updated = await prisma.student.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        externalId: data.externalId,
        status: data.status,
        notes: data.notes,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "student.update",
      entity: "Student",
      entityId: updated.id,
      diff: computeDiff(before, updated, ["fullName", "externalId", "status", "notes"]),
    });
    revalidatePath("/students");
    revalidatePath(`/students/${data.id}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateStudentStatus(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(updateStatusSchema, values);
    await assertStudentAccess(user, data.id);

    const before = await prisma.student.findUnique({
      where: { id: data.id },
      select: { status: true },
    });
    if (!before) return fail("Student not found.");

    await prisma.student.update({ where: { id: data.id }, data: { status: data.status } });
    await writeAudit({
      actorId: user.id,
      action: "student.status",
      entity: "Student",
      entityId: data.id,
      diff: { status: { from: before.status, to: data.status } },
    });
    revalidatePath(`/students/${data.id}`);
    revalidatePath("/students");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateStudentNotes(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(updateNotesSchema, values);
    await assertStudentAccess(user, data.id);

    await prisma.student.update({ where: { id: data.id }, data: { notes: data.notes } });
    await writeAudit({
      actorId: user.id,
      action: "student.notes",
      entity: "Student",
      entityId: data.id,
      diff: { notes: redact(data.notes) },
    });
    revalidatePath(`/students/${data.id}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteStudent(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_WRITE);
    const data = parse(deleteStudentSchema, values);
    await assertStudentAccess(user, data.id);

    await prisma.student.delete({ where: { id: data.id } });
    await writeAudit({
      actorId: user.id,
      action: "student.delete",
      entity: "Student",
      entityId: data.id,
    });
    revalidatePath("/students");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteStudents(values: unknown): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireCapability(Capability.STUDENT_WRITE);
    const data = parse(deleteStudentsSchema, values);

    // Teachers may only delete students assigned to them — assert each first.
    for (const id of data.ids) {
      await assertStudentAccess(user, id);
    }

    const result = await prisma.student.deleteMany({ where: { id: { in: data.ids } } });
    await writeAudit({
      actorId: user.id,
      action: "student.bulkDelete",
      entity: "Student",
      entityId: data.ids[0],
      diff: { count: result.count, ids: data.ids },
    });
    revalidatePath("/students");
    return ok({ count: result.count });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function addMark(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.STUDENT_RECORDS_WRITE);
    const data = parse(markSchema, values);
    await assertStudentAccess(user, data.studentId);

    const mark = await prisma.mark.create({
      data: {
        studentId: data.studentId,
        subject: data.subject,
        score: data.score,
        maxScore: data.maxScore,
        term: data.term,
        recordedById: user.id,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "mark.create",
      entity: "Mark",
      entityId: mark.id,
      diff: { studentId: data.studentId, subject: data.subject, term: data.term },
    });
    revalidatePath(`/students/${data.studentId}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}

export async function addHealthRecord(values: unknown): Promise<ActionResult> {
  try {
    // Teachers may write health records only for assigned students (matrix).
    const user = await requireCapability(Capability.HEALTH_WRITE);
    const data = parse(healthRecordSchema, values);
    await assertStudentAccess(user, data.studentId);

    const record = await prisma.healthRecord.create({
      data: {
        studentId: data.studentId,
        category: data.category,
        summary: data.summary,
        details: encryptNullable(data.details, HEALTH_AAD),
        recordedById: user.id,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "health.create",
      entity: "HealthRecord",
      entityId: record.id,
      // Never log the sensitive details payload.
      diff: { studentId: data.studentId, category: data.category, details: redact(data.details) },
    });
    revalidatePath(`/students/${data.studentId}`);
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
