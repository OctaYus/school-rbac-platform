-- Replace Todo.completed (boolean) with Todo.status (enum), preserving data.
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
ALTER TABLE "Todo" ADD COLUMN "status" "TodoStatus" NOT NULL DEFAULT 'TODO';
UPDATE "Todo" SET "status" = 'DONE' WHERE "completed" = true;
ALTER TABLE "Todo" DROP COLUMN "completed";
