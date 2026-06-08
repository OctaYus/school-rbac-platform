import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limit keys and audit logs.
 *
 * Prefer `x-real-ip`: on Vercel the platform sets it to the true client IP and
 * it cannot be forged by the client. `x-forwarded-for` is only a fallback (dev /
 * other proxies) — its left-most entry is attacker-controllable, so trusting it
 * first would let a client rotate IPs to bypass per-IP rate limits.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent");
}
