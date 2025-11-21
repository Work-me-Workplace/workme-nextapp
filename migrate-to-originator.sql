-- Migration: createdByWorkMeId -> originatorId, remove workMeCompanyId from Company

-- Step 1: Rename createdByWorkMeId to originatorId in all tables
DO $$ 
BEGIN
    -- Rename columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CommsOutput' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "CommsOutput" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Objective' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "Objective" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Achievement' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "Achievement" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContext' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContext" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextCampaign' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextCampaign" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextImpactEvent' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextImpactEvent" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextTraining' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextTraining" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextEvent' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextEvent" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextCommunity' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextCommunity" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextBenefits' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextBenefits" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextCareer' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextCareer" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkContextEmployeeCause' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkContextEmployeeCause" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkSupport' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkSupport" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkOutput' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkOutput" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkOutputStandalone' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkOutputStandalone" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ntk' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "ntk" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkforceComms' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkforceComms" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkforceCommsDraft' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkforceCommsDraft" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkforceCommsEdition' AND column_name = 'createdByWorkMeId') THEN
        ALTER TABLE "WorkforceCommsEdition" RENAME COLUMN "createdByWorkMeId" TO "originatorId";
    END IF;
END $$;

-- Step 2: Update indexes
DROP INDEX IF EXISTS "CommsOutput_createdByWorkMeId_idx";
CREATE INDEX IF NOT EXISTS "CommsOutput_originatorId_idx" ON "CommsOutput"("originatorId");

DROP INDEX IF EXISTS "Objective_createdByWorkMeId_idx";
CREATE INDEX IF NOT EXISTS "Objective_originatorId_idx" ON "Objective"("originatorId");

DROP INDEX IF EXISTS "Achievement_createdByWorkMeId_idx";
CREATE INDEX IF NOT EXISTS "Achievement_originatorId_idx" ON "Achievement"("originatorId");

DROP INDEX IF EXISTS "WorkContext_createdByWorkMeId_idx";
CREATE INDEX IF NOT EXISTS "WorkContext_originatorId_idx" ON "WorkContext"("originatorId");

-- Step 3: Remove workMeCompanyId from Company (if exists and data allows)
-- Note: This will fail if there's data, so handle carefully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Company' AND column_name = 'workMeCompanyId') THEN
        -- Drop the foreign key constraint first
        ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_workMeCompanyId_fkey";
        -- Then drop the column
        ALTER TABLE "Company" DROP COLUMN IF EXISTS "workMeCompanyId";
    END IF;
END $$;

-- Step 4: Add unique constraint on Company.name (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Company_name_key'
    ) THEN
        ALTER TABLE "Company" ADD CONSTRAINT "Company_name_key" UNIQUE ("name");
    END IF;
END $$;

