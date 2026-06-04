import type { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { can, canAssignRole, isTeacher, type Capability } from "@/lib/auth/permissions";

/**
 * Layer 2 of RBAC: fine-grained authorization helpers for server actions and
 * route handlers. Every server entry point re-derives the user from the session
 * (never trusts the client) and re-authorizes here.
 */

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export async function requireCapability(capability: Capability): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, capability)) throw new ForbiddenError();
  return user;
}

export function assertCanAssignRole(actor: CurrentUser, targetRole: Role): void {
  if (!canAssignRole(actor.role, targetRole)) throw new ForbiddenError();
}

/**
 * Resource ownership + tenant isolation: the student must belong to the user's
 * organization, and a TEACHER may only touch a student assigned to them.
 */
export async function assertStudentAccess(user: CurrentUser, studentId: string): Promise<void> {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId: user.organizationId,
      ...(isTeacher(user.role) ? { assignments: { some: { teacherId: user.id } } } : {}),
    },
    select: { id: true },
  });
  if (!student) throw new ForbiddenError();
}

/**
 * The session must belong to the user's organization, and a TEACHER may only
 * mark/modify their own sessions.
 */
export async function assertSessionOwnership(user: CurrentUser, sessionId: string): Promise<void> {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      organizationId: user.organizationId,
      ...(isTeacher(user.role) ? { teacherId: user.id } : {}),
    },
    select: { id: true },
  });
  if (!session) throw new ForbiddenError();
}
