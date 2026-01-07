-- Standardize CompanyX Models: Rename createdByWorkMeId to workMeId, add location fields, add CompanyLeaderEngagement, drop EventItem

-- Step 1: Add workMeId columns (nullable first)
ALTER TABLE "CompanyCampaign" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyImpactEvent" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyEvent" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyCommunity" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyBenefits" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyCareer" ADD COLUMN IF NOT EXISTS "workMeId" UUID;
ALTER TABLE "CompanyEmployeeCause" ADD COLUMN IF NOT EXISTS "workMeId" UUID;

-- Step 2: Copy data from createdByWorkMeId to workMeId
UPDATE "CompanyCampaign" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyImpactEvent" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyTraining" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyEvent" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyCommunity" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyBenefits" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyCareer" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;
UPDATE "CompanyEmployeeCause" SET "workMeId" = "createdByWorkMeId" WHERE "createdByWorkMeId" IS NOT NULL;

-- Step 3: Add location fields where missing
ALTER TABLE "CompanyEvent" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CompanyCampaign" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CompanyImpactEvent" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CompanyBenefits" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CompanyCommunity" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
ALTER TABLE "CompanyCommunity" ADD COLUMN IF NOT EXISTS "endTime" TEXT;

-- Step 4: Create CompanyLeaderEngagement table
CREATE TABLE IF NOT EXISTS "CompanyLeaderEngagement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "engagementDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "topicAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "potentialQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keyMessages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "talkingPoints" TEXT,
    "leaderName" TEXT,
    "leaderTitle" TEXT,
    "leaderId" TEXT,
    "audience" "EventAudience",
    "registrationRequired" TEXT,
    "registrationLink" TEXT,
    "format" TEXT,
    "qAndAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pocEmail" TEXT,
    "pocPhone" TEXT,
    "ingestRawText" TEXT,
    "summary" TEXT,
    "companyId" TEXT,
    "workMeId" UUID NOT NULL,

    CONSTRAINT "CompanyLeaderEngagement_pkey" PRIMARY KEY ("id")
);

-- Step 5: Add foreign keys and indexes for CompanyLeaderEngagement
CREATE INDEX IF NOT EXISTS "CompanyLeaderEngagement_companyId_idx" ON "CompanyLeaderEngagement"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyLeaderEngagement_workMeId_idx" ON "CompanyLeaderEngagement"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyLeaderEngagement_engagementDate_idx" ON "CompanyLeaderEngagement"("engagementDate");
CREATE INDEX IF NOT EXISTS "CompanyLeaderEngagement_leaderId_idx" ON "CompanyLeaderEngagement"("leaderId");

-- Step 6: Add companyLeaderEngagementId to OneOffEmailItem
ALTER TABLE "OneOffEmailItem" ADD COLUMN IF NOT EXISTS "companyLeaderEngagementId" TEXT;

-- Step 7: Add companyLeaderEngagementId to CompanyWork
ALTER TABLE "CompanyWork" ADD COLUMN IF NOT EXISTS "companyLeaderEngagementId" TEXT;

-- Step 8: Add index on eventDate for CompanyEvent
CREATE INDEX IF NOT EXISTS "CompanyEvent_eventDate_idx" ON "CompanyEvent"("eventDate");

-- Step 9: Make workMeId required (after data migration)
-- Note: We'll make these required in a follow-up migration if needed, or handle nulls
-- For now, keep nullable to avoid breaking existing data

-- Step 10: Drop EventItem table (deprecated)
DROP TABLE IF EXISTS "EventItem";

-- Step 11: Update foreign key constraints
-- Drop old foreign keys
ALTER TABLE "CompanyCampaign" DROP CONSTRAINT IF EXISTS "CompanyCampaign_createdByWorkMeId_fkey";
ALTER TABLE "CompanyImpactEvent" DROP CONSTRAINT IF EXISTS "CompanyImpactEvent_createdByWorkMeId_fkey";
ALTER TABLE "CompanyTraining" DROP CONSTRAINT IF EXISTS "CompanyTraining_createdByWorkMeId_fkey";
ALTER TABLE "CompanyEvent" DROP CONSTRAINT IF EXISTS "CompanyEvent_createdByWorkMeId_fkey";
ALTER TABLE "CompanyCommunity" DROP CONSTRAINT IF EXISTS "CompanyCommunity_createdByWorkMeId_fkey";
ALTER TABLE "CompanyBenefits" DROP CONSTRAINT IF EXISTS "CompanyBenefits_createdByWorkMeId_fkey";
ALTER TABLE "CompanyCareer" DROP CONSTRAINT IF EXISTS "CompanyCareer_createdByWorkMeId_fkey";
ALTER TABLE "CompanyEmployeeCause" DROP CONSTRAINT IF EXISTS "CompanyEmployeeCause_createdByWorkMeId_fkey";

-- Add new foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyCampaign_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyCampaign" ADD CONSTRAINT "CompanyCampaign_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyImpactEvent_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyImpactEvent" ADD CONSTRAINT "CompanyImpactEvent_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyTraining_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyTraining" ADD CONSTRAINT "CompanyTraining_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyEvent_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyEvent" ADD CONSTRAINT "CompanyEvent_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyCommunity_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyCommunity" ADD CONSTRAINT "CompanyCommunity_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyBenefits_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyBenefits" ADD CONSTRAINT "CompanyBenefits_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyCareer_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyCareer" ADD CONSTRAINT "CompanyCareer_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyEmployeeCause_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyEmployeeCause" ADD CONSTRAINT "CompanyEmployeeCause_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyLeaderEngagement_workMeId_fkey'
    ) THEN
        ALTER TABLE "CompanyLeaderEngagement" ADD CONSTRAINT "CompanyLeaderEngagement_workMeId_fkey" 
            FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyLeaderEngagement_companyId_fkey'
    ) THEN
        ALTER TABLE "CompanyLeaderEngagement" ADD CONSTRAINT "CompanyLeaderEngagement_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 12: Add foreign key for OneOffEmailItem.companyLeaderEngagementId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'OneOffEmailItem_companyLeaderEngagementId_fkey'
    ) THEN
        ALTER TABLE "OneOffEmailItem" ADD CONSTRAINT "OneOffEmailItem_companyLeaderEngagementId_fkey" 
            FOREIGN KEY ("companyLeaderEngagementId") REFERENCES "CompanyLeaderEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 13: Add foreign key for CompanyWork.companyLeaderEngagementId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyWork_companyLeaderEngagementId_fkey'
    ) THEN
        ALTER TABLE "CompanyWork" ADD CONSTRAINT "CompanyWork_companyLeaderEngagementId_fkey" 
            FOREIGN KEY ("companyLeaderEngagementId") REFERENCES "CompanyLeaderEngagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 14: Update indexes - drop old createdByWorkMeId indexes, add new workMeId indexes
DROP INDEX IF EXISTS "CompanyCampaign_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyImpactEvent_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyTraining_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyEvent_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyCommunity_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyBenefits_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyCareer_createdByWorkMeId_idx";
DROP INDEX IF EXISTS "CompanyEmployeeCause_createdByWorkMeId_idx";

CREATE INDEX IF NOT EXISTS "CompanyCampaign_workMeId_idx" ON "CompanyCampaign"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyImpactEvent_workMeId_idx" ON "CompanyImpactEvent"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyTraining_workMeId_idx" ON "CompanyTraining"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyEvent_workMeId_idx" ON "CompanyEvent"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyCommunity_workMeId_idx" ON "CompanyCommunity"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyBenefits_workMeId_idx" ON "CompanyBenefits"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyCareer_workMeId_idx" ON "CompanyCareer"("workMeId");
CREATE INDEX IF NOT EXISTS "CompanyEmployeeCause_workMeId_idx" ON "CompanyEmployeeCause"("workMeId");
CREATE INDEX IF NOT EXISTS "OneOffEmailItem_companyLeaderEngagementId_idx" ON "OneOffEmailItem"("companyLeaderEngagementId");
CREATE INDEX IF NOT EXISTS "CompanyWork_companyLeaderEngagementId_idx" ON "CompanyWork"("companyLeaderEngagementId");

-- Step 15: Drop old createdByWorkMeId columns (after foreign keys are updated)
ALTER TABLE "CompanyCampaign" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyImpactEvent" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyTraining" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyEvent" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyCommunity" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyBenefits" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyCareer" DROP COLUMN IF EXISTS "createdByWorkMeId";
ALTER TABLE "CompanyEmployeeCause" DROP COLUMN IF EXISTS "createdByWorkMeId";

