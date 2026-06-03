import { createHash } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  checkPasswordPolicy,
  type PasswordPolicyResult,
} from "@/lib/auth/password-policy";

/**
 * Password hashing (Argon2id) and policy enforcement.
 *
 * Argon2id is the library default. Parameters follow current OWASP guidance:
 * 19 MiB memory, 2 passes, 1 lane. A per-hash random salt is generated and
 * embedded in the encoded hash by the library, so no separate salt column is
 * needed. (`Algorithm` is an ambient const enum and cannot be referenced under
 * Next's `isolatedModules`, so we rely on the Argon2id default.)
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  try {
    // The encoded hash carries its own parameters; no options needed to verify.
    return await verify(hashString, password);
  } catch {
    // Malformed hash, wrong algorithm, etc. Never throw to the caller.
    return false;
  }
}

/**
 * Check a password against the HaveIBeenPwned breach corpus using k-anonymity:
 * only the first 5 chars of the SHA-1 are sent; the full hash never leaves the
 * server. Returns the number of times the password has appeared in breaches
 * (0 = not found). Fails open (returns 0) on network error so sign-up is not
 * blocked by a third-party outage — callers may treat that as acceptable.
 */
export async function pwnedCount(password: string): Promise<number> {
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return 0;
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) return Number.parseInt(count ?? "0", 10) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function isPasswordBreached(password: string): Promise<boolean> {
  return (await pwnedCount(password)) > 0;
}
