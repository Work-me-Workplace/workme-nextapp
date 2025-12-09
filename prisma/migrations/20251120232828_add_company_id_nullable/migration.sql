-- AlterTable (only if tables exist)
-- NOTE: Achievement model doesn't have companyId in current schema, so skip Achievement changes
DO $$ 
BEGIN
    -- Achievement table changes skipped - model doesn't have companyId field in current schema
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CommsOutput') THEN
        ALTER TABLE "CommsOutput" DROP COLUMN IF EXISTS "workMeId",
        ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdByWorkMeId" TEXT;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Objective') THEN
        ALTER TABLE "Objective" DROP COLUMN IF EXISTS "workMeId",
        ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdByWorkMeId" TEXT;
    END IF;
END $$;

-- AlterTable: WorkContext* tables (only if they exist - these were refactored to CompanyX)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContext') THEN
        ALTER TABLE "WorkContext" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextBenefits') THEN
        ALTER TABLE "WorkContextBenefits" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCampaign') THEN
        ALTER TABLE "WorkContextCampaign" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCareer') THEN
        ALTER TABLE "WorkContextCareer" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCommunity') THEN
        ALTER TABLE "WorkContextCommunity" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEmployeeCause') THEN
        ALTER TABLE "WorkContextEmployeeCause" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEvent') THEN
        ALTER TABLE "WorkContextEvent" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextImpactEvent') THEN
        ALTER TABLE "WorkContextImpactEvent" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextTraining') THEN
        ALTER TABLE "WorkContextTraining" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
END $$;

-- AlterTable
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutput') THEN
        ALTER TABLE "WorkOutput" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutputStandalone') THEN
        ALTER TABLE "WorkOutputStandalone" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkSupport') THEN
        ALTER TABLE "WorkSupport" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceComms') THEN
        ALTER TABLE "WorkforceComms" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdByWorkMeId" TEXT;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsDraft') THEN
        ALTER TABLE "WorkforceCommsDraft" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdByWorkMeId" TEXT;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsEdition') THEN
        ALTER TABLE "WorkforceCommsEdition" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdByWorkMeId" TEXT;
    END IF;
END $$;

-- CreateIndex (only if tables exist)
-- NOTE: Achievement model doesn't have companyId in current schema, so skip Achievement indexes
DO $$ 
BEGIN
    -- Achievement indexes skipped - model doesn't have companyId field in current schema
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CommsOutput') THEN
        CREATE INDEX IF NOT EXISTS "CommsOutput_companyId_idx" ON "CommsOutput"("companyId");
        CREATE INDEX IF NOT EXISTS "CommsOutput_createdByWorkMeId_idx" ON "CommsOutput"("createdByWorkMeId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Objective') THEN
        CREATE INDEX IF NOT EXISTS "Objective_companyId_idx" ON "Objective"("companyId");
        CREATE INDEX IF NOT EXISTS "Objective_createdByWorkMeId_idx" ON "Objective"("createdByWorkMeId");
    END IF;
END $$;

-- CreateIndex: WorkContext* tables (only if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContext') THEN
        CREATE INDEX IF NOT EXISTS "WorkContext_companyId_idx" ON "WorkContext"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextBenefits') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextBenefits_companyId_idx" ON "WorkContextBenefits"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCampaign') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextCampaign_companyId_idx" ON "WorkContextCampaign"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCareer') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextCareer_companyId_idx" ON "WorkContextCareer"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCommunity') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextCommunity_companyId_idx" ON "WorkContextCommunity"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEmployeeCause') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextEmployeeCause_companyId_idx" ON "WorkContextEmployeeCause"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEvent') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextEvent_companyId_idx" ON "WorkContextEvent"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextImpactEvent') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextImpactEvent_companyId_idx" ON "WorkContextImpactEvent"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextTraining') THEN
        CREATE INDEX IF NOT EXISTS "WorkContextTraining_companyId_idx" ON "WorkContextTraining"("companyId");
    END IF;
END $$;

-- CreateIndex
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutput') THEN
        CREATE INDEX IF NOT EXISTS "WorkOutput_companyId_idx" ON "WorkOutput"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutputStandalone') THEN
        CREATE INDEX IF NOT EXISTS "WorkOutputStandalone_companyId_idx" ON "WorkOutputStandalone"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkSupport') THEN
        CREATE INDEX IF NOT EXISTS "WorkSupport_companyId_idx" ON "WorkSupport"("companyId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceComms') THEN
        CREATE INDEX IF NOT EXISTS "WorkforceComms_companyId_idx" ON "WorkforceComms"("companyId");
        CREATE INDEX IF NOT EXISTS "WorkforceComms_createdByWorkMeId_idx" ON "WorkforceComms"("createdByWorkMeId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsDraft') THEN
        CREATE INDEX IF NOT EXISTS "WorkforceCommsDraft_companyId_idx" ON "WorkforceCommsDraft"("companyId");
        CREATE INDEX IF NOT EXISTS "WorkforceCommsDraft_createdByWorkMeId_idx" ON "WorkforceCommsDraft"("createdByWorkMeId");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsEdition') THEN
        CREATE INDEX IF NOT EXISTS "WorkforceCommsEdition_companyId_idx" ON "WorkforceCommsEdition"("companyId");
        CREATE INDEX IF NOT EXISTS "WorkforceCommsEdition_createdByWorkMeId_idx" ON "WorkforceCommsEdition"("createdByWorkMeId");
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CommsOutput') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommsOutput_companyId_fkey') THEN
            ALTER TABLE "CommsOutput" ADD CONSTRAINT "CommsOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommsOutput_createdByWorkMeId_fkey') THEN
            ALTER TABLE "CommsOutput" ADD CONSTRAINT "CommsOutput_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Objective') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Objective_companyId_fkey') THEN
            ALTER TABLE "Objective" ADD CONSTRAINT "Objective_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Objective_createdByWorkMeId_fkey') THEN
            ALTER TABLE "Objective" ADD CONSTRAINT "Objective_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    -- NOTE: Achievement model doesn't have companyId in current schema, so skip these foreign keys
    -- IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Achievement') THEN
    --     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Achievement_companyId_fkey') THEN
    --         ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    --     END IF;
    --     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Achievement_createdByWorkMeId_fkey') THEN
    --         ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    --     END IF;
    -- END IF;
END $$;

-- AddForeignKey: WorkContext* tables (only if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContext') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContext_companyId_fkey') THEN
            ALTER TABLE "WorkContext" ADD CONSTRAINT "WorkContext_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContext_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContext" ADD CONSTRAINT "WorkContext_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCampaign') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCampaign_companyId_fkey') THEN
            ALTER TABLE "WorkContextCampaign" ADD CONSTRAINT "WorkContextCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCampaign_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextCampaign" ADD CONSTRAINT "WorkContextCampaign_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextImpactEvent') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextImpactEvent_companyId_fkey') THEN
            ALTER TABLE "WorkContextImpactEvent" ADD CONSTRAINT "WorkContextImpactEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextImpactEvent_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextImpactEvent" ADD CONSTRAINT "WorkContextImpactEvent_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextTraining') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextTraining_companyId_fkey') THEN
            ALTER TABLE "WorkContextTraining" ADD CONSTRAINT "WorkContextTraining_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextTraining_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextTraining" ADD CONSTRAINT "WorkContextTraining_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEvent') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextEvent_companyId_fkey') THEN
            ALTER TABLE "WorkContextEvent" ADD CONSTRAINT "WorkContextEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextEvent_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextEvent" ADD CONSTRAINT "WorkContextEvent_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCommunity') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCommunity_companyId_fkey') THEN
            ALTER TABLE "WorkContextCommunity" ADD CONSTRAINT "WorkContextCommunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCommunity_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextCommunity" ADD CONSTRAINT "WorkContextCommunity_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextBenefits') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextBenefits_companyId_fkey') THEN
            ALTER TABLE "WorkContextBenefits" ADD CONSTRAINT "WorkContextBenefits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextBenefits_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextBenefits" ADD CONSTRAINT "WorkContextBenefits_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextCareer') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCareer_companyId_fkey') THEN
            ALTER TABLE "WorkContextCareer" ADD CONSTRAINT "WorkContextCareer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextCareer_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextCareer" ADD CONSTRAINT "WorkContextCareer_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContextEmployeeCause') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextEmployeeCause_companyId_fkey') THEN
            ALTER TABLE "WorkContextEmployeeCause" ADD CONSTRAINT "WorkContextEmployeeCause_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkContextEmployeeCause_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkContextEmployeeCause" ADD CONSTRAINT "WorkContextEmployeeCause_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Other tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkSupport') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkSupport_companyId_fkey') THEN
            ALTER TABLE "WorkSupport" ADD CONSTRAINT "WorkSupport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkSupport_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkSupport" ADD CONSTRAINT "WorkSupport_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutput') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOutput_companyId_fkey') THEN
            ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOutput_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutputStandalone') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOutputStandalone_companyId_fkey') THEN
            ALTER TABLE "WorkOutputStandalone" ADD CONSTRAINT "WorkOutputStandalone_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOutputStandalone_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkOutputStandalone" ADD CONSTRAINT "WorkOutputStandalone_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceComms') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceComms_companyId_fkey') THEN
            ALTER TABLE "WorkforceComms" ADD CONSTRAINT "WorkforceComms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceComms_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkforceComms" ADD CONSTRAINT "WorkforceComms_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsDraft') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceCommsDraft_companyId_fkey') THEN
            ALTER TABLE "WorkforceCommsDraft" ADD CONSTRAINT "WorkforceCommsDraft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceCommsDraft_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkforceCommsDraft" ADD CONSTRAINT "WorkforceCommsDraft_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkforceCommsEdition') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceCommsEdition_companyId_fkey') THEN
            ALTER TABLE "WorkforceCommsEdition" ADD CONSTRAINT "WorkforceCommsEdition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkforceCommsEdition_createdByWorkMeId_fkey') THEN
            ALTER TABLE "WorkforceCommsEdition" ADD CONSTRAINT "WorkforceCommsEdition_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
