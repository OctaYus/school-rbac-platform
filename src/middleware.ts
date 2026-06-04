import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { buildCsp, SECURITY_HEADERS } from "@/lib/security/headers";

/**
 * Edge middleware: RBAC route gating (layer 1) + per-request CSP nonce and
 * security headers.
 *
 * Fine-grained capability and per-resource ownership checks are enforced again
 * in every server action / route handler (guards.ts) and the data layer
 * (scopedFor). Never rely on middleware alone.
 */
const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/accept-invite", "/api/health"];
const ADMIN_PREFIXES = ["/admin"];

function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth?.user);
  const role = req.auth?.user?.role;

  const nonce = makeNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Setting the CSP on the forwarded request lets Next apply the nonce to its
  // own framework <script> tags.
  requestHeaders.set("content-security-policy", csp);

  const withSecurity = (res: NextResponse): NextResponse => {
    res.headers.set("content-security-policy", csp);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  };
  const proceed = () => withSecurity(NextResponse.next({ request: { headers: requestHeaders } }));

  if (path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
    return proceed();
  }

  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return withSecurity(NextResponse.redirect(url));
  }

  if (ADMIN_PREFIXES.some((p) => path.startsWith(p)) && role !== "OWNER" && role !== "MANAGER") {
    return withSecurity(NextResponse.redirect(new URL("/forbidden", nextUrl)));
  }

  return proceed();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)"],
};
