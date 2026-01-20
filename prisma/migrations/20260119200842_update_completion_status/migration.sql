-- Add new columns first
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "cancelled" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: If completed was true, set completed_at to now
-- Only if the completed column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'OrderItem' AND column_name = 'completed') THEN
        UPDATE "OrderItem" SET "completed_at" = NOW() WHERE "completed" = true;
    END IF;
END $$;

-- Migrate existing cancelled data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'OrderItem' AND column_name = 'is_cancelled') THEN
        UPDATE "OrderItem" SET "cancelled" = true WHERE "is_cancelled" = true;
    END IF;
END $$;

-- Drop the old columns
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "completed";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "is_cancelled";
