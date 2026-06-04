-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "priority" "TodoPriority" NOT NULL DEFAULT 'NONE';

