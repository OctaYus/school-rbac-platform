"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { type ActionResult, handleActionError, ok } from "@/lib/action-result";
import { updateOrgSchema } from "@/lib/validation/org";

function parse<S extends z.ZodTypeAny>(schema: S, values: unknown): z.infer<S> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new ValidationError("Please check the form.", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export async function updateOrganization(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireCapability(Capability.SETTINGS_MANAGE);
    const data = parse(updateOrgSchema, values);

    const before = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    });

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: data.name },
    });
    await writeAudit({
      actorId: user.id,
      action: "org.update",
      entity: "Organization",
      entityId: user.organizationId,
      diff: { name: { from: before?.name ?? null, to: data.name } },
    });
    revalidatePath("/admin/organization");
    return ok();
  } catch (e) {
    return handleActionError(e);
  }
}
