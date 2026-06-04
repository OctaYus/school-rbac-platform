-- Multi-tenancy: introduce Organization and scope all domain data to it.
-- Existing rows are backfilled into a single "Default Organization" so nothing
-- breaks. Non-destructive (additive columns + index swaps).

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Default tenant for any pre-existing data.
INSERT INTO "Organization" ("id", "name", "slug", "plan", "updatedAt")
VALUES ('org_default', 'Default Organization', 'default', 'FREE', CURRENT_TIMESTAMP);

-- DropIndex (global uniques become per-organization)
DROP INDEX "SessionTemplate_type_key";
DROP INDEX "Student_externalId_key";

-- Add organizationId, backfilling existing rows to the default org, then drop
-- the temporary default so new rows must set it explicitly.
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "User" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Student" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "Student" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Session" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "Session" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "SessionTemplate" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "SessionTemplate" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Todo" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "Todo" ALTER COLUMN "organizationId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");
CREATE UNIQUE INDEX "Student_organizationId_externalId_key" ON "Student"("organizationId", "externalId");
CREATE INDEX "Session_organizationId_idx" ON "Session"("organizationId");
CREATE INDEX "SessionTemplate_organizationId_idx" ON "SessionTemplate"("organizationId");
CREATE UNIQUE INDEX "SessionTemplate_organizationId_type_key" ON "SessionTemplate"("organizationId", "type");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "Todo_organizationId_idx" ON "Todo"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionTemplate" ADD CONSTRAINT "SessionTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
