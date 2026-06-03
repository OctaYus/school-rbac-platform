import { createHash } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { prisma } from "@/lib/db";

/**
 * PrismaAdapter wrapper that stores email verification / magic-link tokens
 * HASHED (SHA-256) at rest. The plaintext token is only ever in the emailed URL;
 * a database leak does not expose usable login links. Tokens remain single-use
 * (deleted on consumption) and short-lived (TTL set on the Email provider).
 */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function HashedTokenPrismaAdapter(): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,

    async createVerificationToken(token) {
      await prisma.verificationToken.create({
        data: {
          identifier: token.identifier,
          token: sha256(token.token),
          expires: token.expires,
        },
      });
      // Return the original (plaintext) token so the provider emails it.
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const row = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token: sha256(token) } },
        });
        return { identifier: row.identifier, token, expires: row.expires };
      } catch {
        // Not found / already used.
        return null;
      }
    },
  };
}
