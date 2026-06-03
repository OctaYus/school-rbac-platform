import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config.
 *
 * This file MUST NOT import anything that pulls in Prisma, Node crypto, or other
 * non-edge modules — it is consumed by `middleware.ts` (edge runtime). Provider
 * `authorize` logic and the DB-backed JWT revalidation live in `auth.ts`, which
 * runs in the Node.js runtime.
 *
 * The `session` callback only copies claims that already exist on the decoded
 * JWT, so middleware can read the user's role without a database round-trip.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?check-email=1",
  },
  providers: [], // populated in auth.ts (Node runtime)
  callbacks: {
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.role) session.user.role = token.role as Session["user"]["role"];
      return session;
    },
    // Coarse "is the user authenticated" gate. Fine-grained role/route checks
    // are done explicitly in middleware.ts.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;

// Avoid importing the augmented Session type at runtime in this edge file.
type Session = import("next-auth").Session;

export default authConfig;
