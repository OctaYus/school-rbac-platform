import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/security/request";

/**
 * Append-only audit logging. Every create/update/delete on User, Student, Mark,
 * HealthRecord and Session calls this with the acting user, the entity, and a
 * field-level diff. The AuditLog table is append-only at the DB level (trigger).
 *
 * Sensitive values must be redacted by the caller before being placed in `diff`
 * (e.g. health details, password hashes) — see redact().
 */
export interface AuditEntry {
  actorId: string;
  action: string; // e.g. "student.update"
  entity: string; // e.g. "Student"
  entityId: string;
  diff?: unknown; // JSON-serializable; cast to Prisma JSON on write
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const [ip, userAgent, actor] = await Promise.all([
    getClientIp(),
    getUserAgent(),
    prisma.user.findUnique({
      where: { id: entry.actorId },
      select: { organizationId: true },
    }),
  ]);
  if (!actor) return; // actor must exist to attribute the event to a tenant
  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      diff: entry.diff === undefined ? undefined : (entry.diff as Prisma.InputJsonValue),
      ip,
      userAgent: userAgent ?? undefined,
    },
  });
}

/** Compute a shallow before/after diff for the given keys. */
export function computeDiff<T extends Record<string, unknown>>(
  before: Partial<T> | null,
  after: Partial<T>,
  keys: (keyof T)[],
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of keys) {
    const from = before?.[key];
    const to = after[key];
    if (from !== to) diff[String(key)] = { from: from ?? null, to: to ?? null };
  }
  return diff;
}

/** Replace sensitive field values with a marker for audit diffs. */
export function redact(value: unknown): string {
  return value === null || value === undefined ? "∅" : "«redacted»";
}
