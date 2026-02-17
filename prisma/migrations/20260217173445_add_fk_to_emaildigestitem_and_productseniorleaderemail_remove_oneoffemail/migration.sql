-- Add FK fields to EmailDigestItem for workforcestuff
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyEventId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyCampaignId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyTrainingId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyBenefitsId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyImpactEventId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyCommunityId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyCareerId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyEmployeeCauseId" TEXT;
ALTER TABLE "EmailDigestItem" ADD COLUMN IF NOT EXISTS "companyLeaderEngagementId" TEXT;

-- Migrate existing sourceType/sourceId data to FK fields (if possible)
-- Note: This is a best-effort migration - manual review may be needed
UPDATE "EmailDigestItem" 
SET "companyEventId" = "sourceId" 
WHERE "sourceType" = 'CompanyEvent' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyCampaignId" = "sourceId" 
WHERE "sourceType" = 'CompanyCampaign' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyTrainingId" = "sourceId" 
WHERE "sourceType" = 'CompanyTraining' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyBenefitsId" = "sourceId" 
WHERE "sourceType" = 'CompanyBenefits' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyImpactEventId" = "sourceId" 
WHERE "sourceType" = 'CompanyImpactEvent' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyCommunityId" = "sourceId" 
WHERE "sourceType" = 'CompanyCommunity' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyCareerId" = "sourceId" 
WHERE "sourceType" = 'CompanyCareer' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyEmployeeCauseId" = "sourceId" 
WHERE "sourceType" = 'CompanyEmployeeCause' AND "sourceId" IS NOT NULL;

UPDATE "EmailDigestItem" 
SET "companyLeaderEngagementId" = "sourceId" 
WHERE "sourceType" = 'CompanyLeaderEngagement' AND "sourceId" IS NOT NULL;

-- Add FK constraints to EmailDigestItem
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyEventId_fkey" FOREIGN KEY ("companyEventId") REFERENCES "CompanyEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyCampaignId_fkey" FOREIGN KEY ("companyCampaignId") REFERENCES "CompanyCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyTrainingId_fkey" FOREIGN KEY ("companyTrainingId") REFERENCES "CompanyTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyBenefitsId_fkey" FOREIGN KEY ("companyBenefitsId") REFERENCES "CompanyBenefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyImpactEventId_fkey" FOREIGN KEY ("companyImpactEventId") REFERENCES "CompanyImpactEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyCommunityId_fkey" FOREIGN KEY ("companyCommunityId") REFERENCES "CompanyCommunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyCareerId_fkey" FOREIGN KEY ("companyCareerId") REFERENCES "CompanyCareer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyEmployeeCauseId_fkey" FOREIGN KEY ("companyEmployeeCauseId") REFERENCES "CompanyEmployeeCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDigestItem" ADD CONSTRAINT "EmailDigestItem_companyLeaderEngagementId_fkey" FOREIGN KEY ("companyLeaderEngagementId") REFERENCES "CompanyLeaderEngagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for EmailDigestItem FK fields
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyEventId_idx" ON "EmailDigestItem"("companyEventId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyCampaignId_idx" ON "EmailDigestItem"("companyCampaignId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyTrainingId_idx" ON "EmailDigestItem"("companyTrainingId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyBenefitsId_idx" ON "EmailDigestItem"("companyBenefitsId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyImpactEventId_idx" ON "EmailDigestItem"("companyImpactEventId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyCommunityId_idx" ON "EmailDigestItem"("companyCommunityId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyCareerId_idx" ON "EmailDigestItem"("companyCareerId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyEmployeeCauseId_idx" ON "EmailDigestItem"("companyEmployeeCauseId");
CREATE INDEX IF NOT EXISTS "EmailDigestItem_companyLeaderEngagementId_idx" ON "EmailDigestItem"("companyLeaderEngagementId");

-- Remove deprecated sourceType/sourceId columns from EmailDigestItem
DROP INDEX IF EXISTS "EmailDigestItem_sourceType_idx";
ALTER TABLE "EmailDigestItem" DROP COLUMN IF EXISTS "sourceType";
ALTER TABLE "EmailDigestItem" DROP COLUMN IF EXISTS "sourceId";

-- Add FK fields to ProductSeniorLeaderEmail for workforcestuff
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyEventId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyCampaignId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyTrainingId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyBenefitsId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyImpactEventId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyCommunityId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyCareerId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyEmployeeCauseId" TEXT;
ALTER TABLE "ProductSeniorLeaderEmail" ADD COLUMN IF NOT EXISTS "companyLeaderEngagementId" TEXT;

-- Add FK constraints to ProductSeniorLeaderEmail
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyEventId_fkey" FOREIGN KEY ("companyEventId") REFERENCES "CompanyEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyCampaignId_fkey" FOREIGN KEY ("companyCampaignId") REFERENCES "CompanyCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyTrainingId_fkey" FOREIGN KEY ("companyTrainingId") REFERENCES "CompanyTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyBenefitsId_fkey" FOREIGN KEY ("companyBenefitsId") REFERENCES "CompanyBenefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyImpactEventId_fkey" FOREIGN KEY ("companyImpactEventId") REFERENCES "CompanyImpactEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyCommunityId_fkey" FOREIGN KEY ("companyCommunityId") REFERENCES "CompanyCommunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyCareerId_fkey" FOREIGN KEY ("companyCareerId") REFERENCES "CompanyCareer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyEmployeeCauseId_fkey" FOREIGN KEY ("companyEmployeeCauseId") REFERENCES "CompanyEmployeeCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSeniorLeaderEmail" ADD CONSTRAINT "ProductSeniorLeaderEmail_companyLeaderEngagementId_fkey" FOREIGN KEY ("companyLeaderEngagementId") REFERENCES "CompanyLeaderEngagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for ProductSeniorLeaderEmail FK fields
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyEventId_idx" ON "ProductSeniorLeaderEmail"("companyEventId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyCampaignId_idx" ON "ProductSeniorLeaderEmail"("companyCampaignId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyTrainingId_idx" ON "ProductSeniorLeaderEmail"("companyTrainingId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyBenefitsId_idx" ON "ProductSeniorLeaderEmail"("companyBenefitsId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyImpactEventId_idx" ON "ProductSeniorLeaderEmail"("companyImpactEventId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyCommunityId_idx" ON "ProductSeniorLeaderEmail"("companyCommunityId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyCareerId_idx" ON "ProductSeniorLeaderEmail"("companyCareerId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyEmployeeCauseId_idx" ON "ProductSeniorLeaderEmail"("companyEmployeeCauseId");
CREATE INDEX IF NOT EXISTS "ProductSeniorLeaderEmail_companyLeaderEngagementId_idx" ON "ProductSeniorLeaderEmail"("companyLeaderEngagementId");

-- Drop OneOffEmailItem table (cascade will handle relations)
DROP TABLE IF EXISTS "OneOffEmailItem" CASCADE;

-- Drop WorkForceOneOffEmailDigest table
DROP TABLE IF EXISTS "WorkForceOneOffEmailDigest" CASCADE;

-- Drop OneOffEmailStatus enum (if it exists and is not used elsewhere)
-- Note: PostgreSQL doesn't support DROP TYPE IF EXISTS with CASCADE easily, so we check first
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OneOffEmailStatus') THEN
        DROP TYPE "OneOffEmailStatus";
    END IF;
END $$;
