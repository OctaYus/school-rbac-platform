"use server";

import { signIn } from "@/auth";
import { passwordResetLimiter } from "@/lib/security/ratelimit";
import { getClientIp } from "@/lib/security/request";
import { requestMagicLinkSchema } from "@/lib/validation/auth";

export interface ForgotResult {
  ok: boolean;
  message: string;
}

const GENERIC = "If an account exists for that email, a sign-in link is on its way.";

/**
 * Send a magic sign-in link. Always returns the same generic message regardless
 * of whether the account exists, to avoid user enumeration. Rate limited per IP.
 */
export async function requestMagicLink(values: unknown): Promise<ForgotResult> {
  const parsed = requestMagicLinkSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  const ip = await getClientIp();
  const rl = await passwordResetLimiter.limit(`magiclink:${ip}`);
  if (!rl.success) {
    return { ok: false, message: "Too many requests. Please try again later." };
  }

  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
  if (smtpConfigured) {
    try {
      await signIn("nodemailer", { email: parsed.data.email, redirect: false });
    } catch {
      // Swallow to preserve the generic response (no enumeration / no leaks).
    }
  }

  return { ok: true, message: GENERIC };
}
