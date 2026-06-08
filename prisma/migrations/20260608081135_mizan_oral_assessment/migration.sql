-- CreateEnum
CREATE TYPE "RubricLevel" AS ENUM ('BEGINNER', 'DEVELOPING', 'COMPETENT', 'DISTINGUISHED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "classroom" TEXT;

-- CreateTable
CREATE TABLE "OralAssessment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surah" TEXT NOT NULL,
    "hifz" "RubricLevel" NOT NULL,
    "tajweed" "RubricLevel" NOT NULL,
    "makharij" "RubricLevel" NOT NULL,
    "oralScore" DECIMAL(5,2) NOT NULL,
    "writtenScore" DECIMAL(5,2),
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OralAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OralAssessment_studentId_idx" ON "OralAssessment"("studentId");

-- CreateIndex
CREATE INDEX "OralAssessment_organizationId_idx" ON "OralAssessment"("organizationId");

-- CreateIndex
CREATE INDEX "Student_classroom_idx" ON "Student"("classroom");

-- AddForeignKey
ALTER TABLE "OralAssessment" ADD CONSTRAINT "OralAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralAssessment" ADD CONSTRAINT "OralAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
