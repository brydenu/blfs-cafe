-- AlterTable: Change personalCup Boolean to cupType String
-- First, add the new column with default value
ALTER TABLE "OrderItem" ADD COLUMN "cupType" TEXT NOT NULL DEFAULT 'to-go';

-- Migrate existing data: false -> 'to-go', true -> 'personal'
UPDATE "OrderItem" SET "cupType" = CASE 
  WHEN "personalCup" = true THEN 'personal'
  ELSE 'to-go'
END;

-- Drop the old column
ALTER TABLE "OrderItem" DROP COLUMN "personalCup";
