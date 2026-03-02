-- AlterEnum: Add new values to EventCategory enum
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'TRAINING';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'SOCIAL';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'NETWORKING';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'WELLNESS';

-- AlterEnum: Add new values to EventAudience enum
ALTER TYPE "EventAudience" ADD VALUE IF NOT EXISTS 'MANAGEMENT';
ALTER TYPE "EventAudience" ADD VALUE IF NOT EXISTS 'DEPARTMENT_SPECIFIC';

-- AlterTable: Add highlights field to CompanyEvent
ALTER TABLE "CompanyEvent" ADD COLUMN IF NOT EXISTS "highlights" JSONB;
