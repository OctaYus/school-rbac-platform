import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/**
 * Layer 1 of RBAC: coarse route protection at the edge.
 *
 * This is intentionally shallow — it gates whole route groups by auth state and
 * admin role. Fine-grained capability and per-resource ownership checks are
 * enforced again in every server action / route handler (guards.ts) and at the
 * data layer (scopedFor). Never rely on middleware alone.
 */
const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/login", "/forgot-password", "/accept-invite", "/api/health"];
const ADMIN_PREFIXES = ["/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth?.user);
  const role = req.auth?.user?.role;

  if (path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
    return; // allow
  }

  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }

  if (ADMIN_PREFIXES.some((p) => path.startsWith(p)) && role !== "OWNER" && role !== "MANAGER") {
    return Response.redirect(new URL("/forbidden", nextUrl));
  }

  return; // authenticated, allowed
});

export const config = {
  // Run on everything except static assets, image optimizer, the NextAuth
  // handler, and files with an extension.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)"],
};
