"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { loginIpLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import { loginSchema } from "@/lib/validation/auth";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

/**
 * Login server action. Server Actions get Next.js's built-in CSRF protection.
 *
 * Layered defenses: per-IP rate limit (here) + per-account lockout and timing
 * equalization (in the Credentials `authorize`). Error messages are deliberately
 * generic to avoid user enumeration.
 */
export async function loginAction(values: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const ip = await getClientIp();
  const rl = await loginIpLimiter.limit(`login:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    // Only include optional fields when present — Auth.js serializes credentials
    // through URLSearchParams, which would turn `undefined` into the literal
    // string "undefined" and fail validation in authorize.
    const credentials: Record<string, string> = {
      email: parsed.data.email,
      password: parsed.data.password,
    };
    if (parsed.data.totp) credentials.totp = parsed.data.totp;
    if (parsed.data.backupCode) credentials.backupCode = parsed.data.backupCode;

    await signIn("credentials", { ...credentials, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email, password, or 2FA code." };
    }
    throw error;
  }

  return { ok: true };
}
