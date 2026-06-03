/**
 * Pure password-policy constants and checks. No Node-only imports, so this is
 * safe to import from client components and validation schemas. Hashing and the
 * HIBP breach check live in password.ts (server-only).
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

export interface PasswordPolicyResult {
  ok: boolean;
  errors: string[];
}

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Must be at most ${PASSWORD_MAX_LENGTH} characters.`);
  }
  if (!/[a-z]/.test(password)) errors.push("Must include a lowercase letter.");
  if (!/[A-Z]/.test(password)) errors.push("Must include an uppercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Must include a digit.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Must include a symbol.");
  return { ok: errors.length === 0, errors };
}
