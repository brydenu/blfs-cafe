-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Suggestion" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
