import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { HashedTokenPrismaAdapter } from "@/lib/auth/adapter";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { backupCodeMatches, verifyTotp } from "@/lib/auth/totp";
import { isLocked, registerFailedLogin, registerSuccessfulLogin } from "@/lib/auth/lockout";
import { decrypt } from "@/lib/security/crypto";
import { loginSchema } from "@/lib/validation/auth";

const JWT_REVALIDATE_MS = 60_000;

// A real argon2 hash used to equalize timing when the account does not exist,
// mitigating user-enumeration via response time. Computed once, lazily.
let dummyHashPromise: Promise<string> | null = null;
function dummyHash(): Promise<string> {
  if (!dummyHashPromise) dummyHashPromise = hashPassword("timing-equalizer-" + Math.random());
  return dummyHashPromise;
}

async function consumeBackupCode(userId: string, code: string): Promise<boolean> {
  const codes = await prisma.backupCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });
  for (const bc of codes) {
    if (backupCodeMatches(code, bc.codeHash)) {
      await prisma.backupCode.update({ where: { id: bc.id }, data: { usedAt: new Date() } });
      return true;
    }
  }
  return false;
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
      totp: {},
      backupCode: {},
    },
    async authorize(raw) {
      try {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, totp, backupCode } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // TEMP diagnostic
        console.error(
          `[diag] email=${email} found=${!!user} hasHash=${!!user?.passwordHash} active=${user?.isActive} locked=${user?.lockedUntil ?? "none"} dbHost=${(process.env.DATABASE_URL ?? "").replace(/^.*@([^/]*).*$/, "$1")}`,
        );

        if (!user || !user.passwordHash) {
          await verifyPassword(await dummyHash(), password); // equalize timing
          return null;
        }
        if (!user.isActive) return null;
        if (isLocked(user)) return null;

        const passwordOk = await verifyPassword(user.passwordHash, password);
        if (!passwordOk) {
          await registerFailedLogin(user.id);
          return null;
        }

        // Second factor, if enabled.
        if (user.mfaEnabled) {
          let mfaOk = false;
          if (totp && user.mfaSecret) {
            mfaOk = verifyTotp(totp, decrypt(user.mfaSecret));
          } else if (backupCode) {
            mfaOk = await consumeBackupCode(user.id, backupCode);
          }
          if (!mfaOk) {
            await registerFailedLogin(user.id);
            return null;
          }
        }

        await registerSuccessfulLogin(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      } catch (e) {
        // TEMP diagnostic: surface the real cause behind a generic CredentialsSignin.
        console.error("[authorize] failure:", e instanceof Error ? e.message : e);
        throw e;
      }
    },
  }),
];

if (smtpConfigured()) {
  providers.push(
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // 10-minute single-use magic link
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: HashedTokenPrismaAdapter(),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Typed view of our custom JWT claims (augmentation is not reliably picked
      // up for the callback's token type in this Auth.js beta).
      const t = token as typeof token & {
        uid?: string;
        role?: Role;
        tokenVersion?: number;
        checkedAt?: number;
      };

      // Initial sign-in: `user` is present (from authorize or the adapter).
      if (user) {
        const u = user as { id?: string; role?: Role; tokenVersion?: number };
        if (u.id) t.uid = u.id;
        if (u.role) t.role = u.role;
        t.tokenVersion = u.tokenVersion ?? 0;
        t.checkedAt = Date.now();

        // Email/magic-link sign-in: role/version may not be on the adapter user.
        if (u.role === undefined && t.uid) {
          const dbUser = await prisma.user.findUnique({
            where: { id: t.uid },
            select: { role: true, tokenVersion: true, isActive: true },
          });
          if (!dbUser || !dbUser.isActive) return null;
          t.role = dbUser.role;
          t.tokenVersion = dbUser.tokenVersion;
        }
        return t;
      }

      // Subsequent requests: revalidate against the DB on an interval so that
      // disabled accounts, role changes, password resets, MFA resets and admin
      // force-logout (all bump tokenVersion / isActive) take effect promptly.
      const last = t.checkedAt ?? 0;
      const stale = Date.now() - last > JWT_REVALIDATE_MS;
      if (trigger === "update" || stale) {
        if (!t.uid) return null;
        const dbUser = await prisma.user.findUnique({
          where: { id: t.uid },
          select: { isActive: true, role: true, tokenVersion: true },
        });
        if (!dbUser || !dbUser.isActive || dbUser.tokenVersion !== t.tokenVersion) {
          return null; // invalidate session
        }
        t.role = dbUser.role;
        t.checkedAt = Date.now();
      }
      return t;
    },
  },
});
