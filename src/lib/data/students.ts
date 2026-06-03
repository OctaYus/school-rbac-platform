import "server-only";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { studentScopeWhere } from "@/lib/db/scope";
import { decryptNullable } from "@/lib/security/crypto";
import type { CurrentUser } from "@/lib/auth/session";
import type { StudentListQuery } from "@/lib/validation/student";

export const STUDENTS_PAGE_SIZE = 10;
const HEALTH_AAD = "healthrecord";

export async function listStudents(user: CurrentUser, query: StudentListQuery) {
  // Apply layer-3 scope directly here so the `select` (incl. _count) stays typed.
  const filters: Prisma.StudentWhereInput = {};
  if (query.q) filters.fullName = { contains: query.q, mode: "insensitive" };
  if (query.status) filters.status = query.status;
  const where: Prisma.StudentWhereInput = { AND: [filters, studentScopeWhere(user)] };

  const [rows, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { [query.sort]: query.dir },
      skip: (query.page - 1) * STUDENTS_PAGE_SIZE,
      take: STUDENTS_PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        externalId: true,
        status: true,
        createdAt: true,
        _count: { select: { marks: true, healthRecords: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    rows,
    total,
    page: query.page,
    pageSize: STUDENTS_PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE)),
  };
}

function safeDecrypt(value: string | null): string | null {
  if (value === null) return null;
  try {
    return decryptNullable(value, HEALTH_AAD);
  } catch {
    return "[unable to decrypt — key mismatch]";
  }
}

export async function getStudentDetail(user: CurrentUser, id: string) {
  // Layer-3 scope applied directly so relation includes stay typed.
  const student = await prisma.student.findFirst({
    where: { AND: [{ id }, studentScopeWhere(user)] },
    include: {
      marks: { orderBy: { recordedAt: "desc" } },
      healthRecords: { orderBy: { recordedAt: "desc" } },
      assignments: { include: { teacher: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!student) return null;

  const audit = await prisma.auditLog.findMany({
    where: { entity: { in: ["Student", "Mark", "HealthRecord"] }, entityId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
  });

  const health = student.healthRecords.map((h) => ({
    id: h.id,
    category: h.category,
    summary: h.summary,
    details: safeDecrypt(h.details),
    recordedAt: h.recordedAt,
  }));

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      externalId: student.externalId,
      status: student.status,
      notes: student.notes,
      createdAt: student.createdAt,
    },
    marks: student.marks,
    health,
    assignments: student.assignments,
    audit,
  };
}

export type StudentDetail = NonNullable<Awaited<ReturnType<typeof getStudentDetail>>>;
