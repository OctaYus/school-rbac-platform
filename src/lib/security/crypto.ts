import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Application-layer encryption for data at rest (AES-256-GCM).
 *
 * Used for sensitive free-text such as HealthRecord.details and the TOTP secret.
 * The ciphertext is stored as a self-describing bundle:
 *
 *     v1:<base64 iv>:<base64 authTag>:<base64 ciphertext>
 *
 * - 256-bit key from ENCRYPTION_KEY (64 hex chars).
 * - 96-bit random IV per encryption (never reused).
 * - 128-bit GCM auth tag verified on decrypt (tamper detection).
 * - Optional Additional Authenticated Data (AAD) binds ciphertext to a context
 *   (e.g. "healthrecord") so a blob cannot be moved between columns/rows.
 *
 * The key is only ever read on the server. It must never be sent to the client.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Use: openssl rand -hex 32",
    );
  }
  cachedKey = Buffer.from(raw, "hex");
  return cachedKey;
}

/** Encrypt a UTF-8 string. Returns the self-describing bundle string. */
export function encrypt(plaintext: string, aad?: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Decrypt a bundle produced by {@link encrypt}. Throws if tampered or malformed. */
export function decrypt(bundle: string, aad?: string): string {
  const parts = bundle.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid ciphertext bundle format");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");

  if (iv.length !== IV_BYTES) throw new Error("Invalid IV length");

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Encrypt a nullable value (passes null/undefined through unchanged). */
export function encryptNullable(value: string | null | undefined, aad?: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return encrypt(value, aad);
}

/** Decrypt a nullable value (passes null/undefined through unchanged). */
export function decryptNullable(value: string | null | undefined, aad?: string): string | null {
  if (value === null || value === undefined) return null;
  return decrypt(value, aad);
}

/** True when a string looks like one of our ciphertext bundles. */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${VERSION}:`);
}

/** Constant-time string comparison (for tokens/hashes already in memory). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
