import { createHash, randomBytes } from "node:crypto";

/** Opaque high-entropy token for invites / one-time links (URL-safe). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hash for storage at rest (the plaintext token only lives in the URL). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
export const INVITE_PREFIX = "invite:";
