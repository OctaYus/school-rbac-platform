import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Layer 3 of RBAC: row-level scoping at the data-access layer.
 *
 * Even if a handler-level check is bypassed, a TEACHER physically cannot read or
 * write another teacher's students/sessions because every query goes through a
 * `scopedFor(user)` accessor that injects an ownership WHERE clause. Non-teacher
 * staff roles get an empty scope (full visibility per the capability matrix).
 */
export type ScopeUser = { id: string; role: Role };

const isTeacher = (u: ScopeUser) => u.role === Role.TEACHER;

export function studentScopeWhere(user: ScopeUser): Prisma.StudentWhereInput {
  if (isTeacher(user)) {
    return { assignments: { some: { teacherId: user.id } } };
  }
  return {};
}

export function sessionScopeWhere(user: ScopeUser): Prisma.SessionWhereInput {
  if (isTeacher(user)) {
    return { teacherId: user.id };
  }
  return {};
}

/** Scope for records that hang off a student (marks, health records). */
export function studentRelatedScopeWhere(
  user: ScopeUser,
): { student: Prisma.StudentWhereInput } | Record<string, never> {
  if (isTeacher(user)) {
    return { student: { assignments: { some: { teacherId: user.id } } } };
  }
  return {};
}

function and<T extends object>(base: T | undefined, scope: object): T {
  if (!scope || Object.keys(scope).length === 0) return (base ?? {}) as T;
  return { AND: [base ?? {}, scope] } as unknown as T;
}

/**
 * Returns ownership-scoped accessors for the current user. Feature code should
 * read/write student & session data exclusively through these.
 */
export function scopedFor(user: ScopeUser) {
  const studentWhere = studentScopeWhere(user);
  const sessionWhere = sessionScopeWhere(user);
  const relatedWhere = studentRelatedScopeWhere(user);

  return {
    student: {
      findMany: (args: Prisma.StudentFindManyArgs = {}) =>
        prisma.student.findMany({ ...args, where: and(args.where, studentWhere) }),
      count: (args: Prisma.StudentCountArgs = {}) =>
        prisma.student.count({ ...args, where: and(args.where, studentWhere) }),
      /** Teacher-safe single fetch by id (returns null if not in scope). */
      findById: (id: string, args: Omit<Prisma.StudentFindFirstArgs, "where"> = {}) =>
        prisma.student.findFirst({ ...args, where: and({ id }, studentWhere) }),
    },
    session: {
      findMany: (args: Prisma.SessionFindManyArgs = {}) =>
        prisma.session.findMany({ ...args, where: and(args.where, sessionWhere) }),
      count: (args: Prisma.SessionCountArgs = {}) =>
        prisma.session.count({ ...args, where: and(args.where, sessionWhere) }),
      findById: (id: string, args: Omit<Prisma.SessionFindFirstArgs, "where"> = {}) =>
        prisma.session.findFirst({ ...args, where: and({ id }, sessionWhere) }),
    },
    mark: {
      findMany: (args: Prisma.MarkFindManyArgs = {}) =>
        prisma.mark.findMany({ ...args, where: and(args.where, relatedWhere) }),
    },
    healthRecord: {
      findMany: (args: Prisma.HealthRecordFindManyArgs = {}) =>
        prisma.healthRecord.findMany({ ...args, where: and(args.where, relatedWhere) }),
    },
  };
}

export type ScopedClient = ReturnType<typeof scopedFor>;
