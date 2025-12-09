-- AlterTable
-- NOTE: Achievement model doesn't have companyId in current schema, so skip Achievement changes
DO $$ 
BEGIN
    -- Achievement table changes skipped - model doesn't have companyId field in current schema
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CommsOutput') THEN
        ALTER TABLE "CommsOutput" ALTER COLUMN "companyId" SET NOT NULL,
        ALTER COLUMN "createdByWorkMeId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Objective') THEN
        ALTER TABLE "Objective" ALTER COLUMN "companyId" SET NOT NULL,
        ALTER COLUMN "createdByWorkMeId" SET NOT NULL;
    END IF;
END $$;

-- AlterTable: WorkContext* tables (only if they exist - these were refactored to CompanyX)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContext') THEN
        ALTER TABLE "WorkContext" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextBenefits') THEN
        ALTER TABLE "WorkContextBenefits" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCampaign') THEN
        ALTER TABLE "WorkContextCampaign" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCareer') THEN
        ALTER TABLE "WorkContextCareer" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCommunity') THEN
        ALTER TABLE "WorkContextCommunity" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEmployeeCause') THEN
        ALTER TABLE "WorkContextEmployeeCause" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEvent') THEN
        ALTER TABLE "WorkContextEvent" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextImpactEvent') THEN
        ALTER TABLE "WorkContextImpactEvent" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextTraining') THEN
        ALTER TABLE "WorkContextTraining" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
END $$;

-- AlterTable: Other tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutput') THEN
        ALTER TABLE "WorkOutput" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutputStandalone') THEN
        ALTER TABLE "WorkOutputStandalone" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkSupport') THEN
        ALTER TABLE "WorkSupport" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
        ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceComms') THEN
        ALTER TABLE "WorkforceComms" ALTER COLUMN "companyId" SET NOT NULL,
        ALTER COLUMN "createdByWorkMeId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsDraft') THEN
        ALTER TABLE "WorkforceCommsDraft" ALTER COLUMN "companyId" SET NOT NULL,
        ALTER COLUMN "createdByWorkMeId" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsEdition') THEN
        ALTER TABLE "WorkforceCommsEdition" ALTER COLUMN "companyId" SET NOT NULL,
        ALTER COLUMN "createdByWorkMeId" SET NOT NULL;
    END IF;
END $$;
