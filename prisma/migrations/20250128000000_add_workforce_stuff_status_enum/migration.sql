-- Create the WorkforceStuffStatus enum
CREATE TYPE "WorkforceStuffStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DRAFT', 'EXPIRED');

-- Add status column to all CompanyX models with default ACTIVE
ALTER TABLE "CompanyCampaign" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyImpactEvent" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyEvent" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyCommunity" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyBenefits" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyCareer" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CompanyEmployeeCause" ADD COLUMN IF NOT EXISTS "status" "WorkforceStuffStatus" NOT NULL DEFAULT 'ACTIVE';

-- Create indexes on status
CREATE INDEX IF NOT EXISTS "CompanyCampaign_status_idx" ON "CompanyCampaign"("status");
CREATE INDEX IF NOT EXISTS "CompanyImpactEvent_status_idx" ON "CompanyImpactEvent"("status");
CREATE INDEX IF NOT EXISTS "CompanyTraining_status_idx" ON "CompanyTraining"("status");
CREATE INDEX IF NOT EXISTS "CompanyEvent_status_idx" ON "CompanyEvent"("status");
CREATE INDEX IF NOT EXISTS "CompanyCommunity_status_idx" ON "CompanyCommunity"("status");
CREATE INDEX IF NOT EXISTS "CompanyBenefits_status_idx" ON "CompanyBenefits"("status");
CREATE INDEX IF NOT EXISTS "CompanyCareer_status_idx" ON "CompanyCareer"("status");
CREATE INDEX IF NOT EXISTS "CompanyEmployeeCause_status_idx" ON "CompanyEmployeeCause"("status");

