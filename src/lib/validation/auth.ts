import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Login input. `.strict()` rejects unexpected keys at the boundary. */
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    totp: z
      .string()
      .trim()
      .regex(/^\d{6}$/)
      .optional(),
    backupCode: z.string().trim().max(20).optional(),
    captchaToken: z.string().max(2048).optional(),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema used INSIDE the Credentials `authorize` callback. Intentionally NOT
 * `.strict()`: Auth.js injects framework fields (csrfToken, callbackUrl, …) into
 * the credentials object, which a strict schema would reject. Unknown keys are
 * stripped; the strict boundary check lives on the user-facing loginAction.
 */
// Auth.js serializes credentials via URLSearchParams, which can turn an absent
// optional field into the literal string "undefined"/"". Coerce those to
// undefined so optional MFA fields don't fail validation.
const optionalLoose = (v: unknown) => (v === "" || v === "undefined" || v == null ? undefined : v);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  totp: z.preprocess(
    optionalLoose,
    z
      .string()
      .trim()
      .regex(/^\d{6}$/)
      .optional(),
  ),
  backupCode: z.preprocess(optionalLoose, z.string().trim().max(20).optional()),
});

/** Strong-password field reused by signup / reset / invite acceptance. */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[a-z]/, "Must include a lowercase letter.")
  .regex(/[A-Z]/, "Must include an uppercase letter.")
  .regex(/[0-9]/, "Must include a digit.")
  .regex(/[^A-Za-z0-9]/, "Must include a symbol.");

export const requestMagicLinkSchema = z.object({ email: emailSchema }).strict();

export const acceptInviteSchema = z
  .object({
    token: z.string().min(10).max(512),
    name: z.string().trim().min(1).max(120),
    password: strongPasswordSchema,
  })
  .strict();

export const setupMfaSchema = z
  .object({
    token: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
  })
  .strict();
