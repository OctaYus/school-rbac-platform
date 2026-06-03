import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { authenticator } from "otplib";

/**
 * TOTP (RFC 6238) MFA helpers + one-time backup codes.
 *
 * The TOTP secret is encrypted at rest (AES-256-GCM) by the caller before it
 * touches the database — this module only deals with the plaintext secret in
 * memory. Backup codes are high-entropy and stored as SHA-256 hashes.
 */

const ISSUER = "School RBAC Platform";

// Allow +/- 1 time-step (30s) of clock skew.
authenticator.options = { window: 1 };

export function generateMfaSecret(): string {
  return authenticator.generateSecret(); // base32
}

/** otpauth:// URI for QR provisioning. */
export function mfaKeyUri(accountEmail: string, secret: string): string {
  return authenticator.keyuri(accountEmail, ISSUER, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    return authenticator.verify({ token: cleaned, secret });
  } catch {
    return false;
  }
}

const BACKUP_CODE_COUNT = 10;

/** Generate plaintext backup codes plus their SHA-256 hashes for storage. */
export function generateBackupCodes(): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 5 bytes -> 8 base32 chars; format "xxxx-xxxx" for readability.
    const raw = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(code);
    hashes.push(hashBackupCode(code));
  }
  return { codes, hashes };
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
}

/** Constant-time comparison of a candidate code against a stored hash. */
export function backupCodeMatches(candidate: string, storedHash: string): boolean {
  const a = Buffer.from(hashBackupCode(candidate), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
