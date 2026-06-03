import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In development Next.js clears the module cache on every request, which would
 * otherwise spawn a new client (and connection pool) per reload. We cache it on
 * `globalThis` to avoid exhausting the database connection limit.
 *
 * Audit logging and the `scopedFor` row-level security extension are layered on
 * top of this base client in lib/db/* — keep the raw client here minimal.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
