import { Role } from "@prisma/client";

/**
 * Pure RBAC capability matrix — the single source of truth for the table in the
 * spec. No I/O imports, so it is unit-testable and safe to import anywhere.
 *
 * Capabilities that say "(only assigned/own)" for TEACHER are still granted here
 * at the role level; the per-resource ownership check is enforced separately in
 * guards.ts + the scopedFor query layer (defense in depth).
 */
export const Capability = {
  USER_MANAGE: "user.manage", // create/disable accounts
  ROLE_ASSIGN: "role.assign", // assign roles (MANAGER cannot create OWNER — see canAssignRole)
  STUDENT_WRITE: "student.write", // create/edit/delete students
  STUDENT_RECORDS_WRITE: "student.records.write", // status, marks, notes
  HEALTH_WRITE: "health.write", // mental + physical health records
  STUDENT_VIEW_ALL: "student.viewAll", // view all students (TEACHER: only assigned)
  SESSION_TEMPLATE_CREATE: "session.template.create",
  SESSION_ASSIGN: "session.assign",
  SESSION_MARK: "session.mark", // taken/missed/rescheduled (TEACHER: only own)
  AUDIT_VIEW: "audit.view",
  CALENDAR_VIEW_ANY: "calendar.viewAny", // any teacher's calendar (TEACHER: only own)
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Capability = (typeof Capability)[keyof typeof Capability];

const ALL: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER];
const ADMINS: Role[] = [Role.OWNER, Role.MANAGER];
const STAFF: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPERVISOR];

export const CAPABILITY_MATRIX: Record<Capability, Role[]> = {
  [Capability.USER_MANAGE]: ADMINS,
  [Capability.ROLE_ASSIGN]: ADMINS,
  [Capability.STUDENT_WRITE]: ALL,
  [Capability.STUDENT_RECORDS_WRITE]: ALL,
  [Capability.HEALTH_WRITE]: ALL,
  [Capability.STUDENT_VIEW_ALL]: STAFF,
  [Capability.SESSION_TEMPLATE_CREATE]: STAFF,
  [Capability.SESSION_ASSIGN]: STAFF,
  [Capability.SESSION_MARK]: ALL,
  [Capability.AUDIT_VIEW]: ADMINS,
  [Capability.CALENDAR_VIEW_ANY]: STAFF,
  [Capability.SETTINGS_MANAGE]: ADMINS,
};

/** Does this role have the given capability (coarse, role-level)? */
export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_MATRIX[capability].includes(role);
}

/**
 * Whether `actorRole` may assign `targetRole` to a user.
 * OWNER can assign any role; MANAGER can assign anything except OWNER; others none.
 */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === Role.OWNER) return true;
  if (actorRole === Role.MANAGER) return targetRole !== Role.OWNER;
  return false;
}

/** Teacher access to a specific student/session is assignment/ownership-based. */
export function isTeacher(role: Role): boolean {
  return role === Role.TEACHER;
}
