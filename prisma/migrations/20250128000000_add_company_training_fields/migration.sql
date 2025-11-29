-- AlterTable: Add missing CompanyTraining fields
-- This migration adds all fields that exist in the Prisma schema but may be missing from the database

ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "endTime" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "format" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "topic" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "pocRankOrTitle" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "ingestRawText" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "ingestType" TEXT;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "ingestStatus" TEXT DEFAULT 'pending';
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "ingestCreatedAt" TIMESTAMP(3);
