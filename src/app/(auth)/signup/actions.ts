"use server";

import { randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { Role } from "@prisma/client";

import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, isPasswordBreached } from "@/lib/auth/password";
import { loginIpLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { signupSchema } from "@/lib/validation/signup";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${slugify(base)}-${randomBytes(2).toString("hex")}`;
  }
  return `${slugify(base)}-${randomBytes(4).toString("hex")}`;
}

/**
 * Self-serve org signup: creates an Organization on a 14-day trial plus its
 * first OWNER, then logs them in.
 */
export async function signupAction(values: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return fail("Please check the form and try again.");
  const { orgName, name, email, password } = parsed.data;

  const ip = await getClientIp();
  const rl = await loginIpLimiter.limit(`signup:${ip}`);
  if (!rl.success) return fail("Too many attempts. Please wait a minute and try again.");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail("An account with that email already exists.");
  if (await isPasswordBreached(password)) {
    return fail("That password has appeared in a data breach. Choose a different one.");
  }

  const slug = await uniqueSlug(orgName);
  const passwordHash = await hashPassword(password);

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      plan: "FREE",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.user.create({
    data: { organizationId: org.id, email, name, role: Role.OWNER, passwordHash, isActive: true },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("Account created — please sign in.");
    }
    throw error;
  }
  return ok();
}
