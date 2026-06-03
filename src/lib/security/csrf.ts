import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Double-submit CSRF token for CUSTOM POST route handlers.
 *
 * Next.js Server Actions already have built-in CSRF protection (Origin checks),
 * so the app's mutations don't need this. It exists for any future `app/api/*`
 * POST endpoints called by our own fetch(): issue a token (readable cookie +
 * echoed in a request header), then verify the two match in constant time.
 */
const CSRF_COOKIE = "csrf-token";
export const CSRF_HEADER = "x-csrf-token";

export async function issueCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const store = await cookies();
  store.set(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable by client JS to echo back
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return token;
}

export async function verifyCsrf(submitted: string | null | undefined): Promise<boolean> {
  if (!submitted) return false;
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(submitted);
  return a.length === b.length && timingSafeEqual(a, b);
}
