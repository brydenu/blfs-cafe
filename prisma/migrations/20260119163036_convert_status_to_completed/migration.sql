-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: convert 'completed' status to true, all others to false
UPDATE "OrderItem" SET "completed" = true WHERE "status" = 'completed';
UPDATE "OrderItem" SET "completed" = false WHERE "status" != 'completed' OR "status" IS NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "status";
