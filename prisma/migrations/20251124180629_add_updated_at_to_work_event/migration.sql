-- AlterTable
-- Add updatedAt column to WorkEvent table
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updatedAt = createdAt (if any exist)
UPDATE "WorkEvent" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

