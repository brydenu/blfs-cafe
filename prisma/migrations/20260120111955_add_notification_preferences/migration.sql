-- Add notification preferences to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationDefaultType" TEXT NOT NULL DEFAULT 'order-complete';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationMethods" JSONB NOT NULL DEFAULT '{"email": true}';

-- Add notification preferences to Order table (nullable = use user default)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notificationType" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notificationMethods" JSONB;
