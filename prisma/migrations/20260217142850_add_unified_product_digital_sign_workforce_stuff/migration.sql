-- Create unified ProductDigitalSignWorkforceStuff model
-- This replaces ProductDigitalSignCompanyEvent and supports all CompanyX types

CREATE TABLE "ProductDigitalSignWorkforceStuff" (
    "id" TEXT NOT NULL,
    "digitalSignId" TEXT NOT NULL,
    
    -- Polymorphic FKs to CompanyX models (exactly one must be set)
    "companyEventId" TEXT,
    "companyTrainingId" TEXT,
    "companyCampaignId" TEXT,
    "companyBenefitsId" TEXT,
    "companyCareerId" TEXT,
    "companyCommunityId" TEXT,
    "companyImpactEventId" TEXT,
    "companyEmployeeCauseId" TEXT,
    "companyLeaderEngagementId" TEXT,
    
    -- Common normalized fields
    "title" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    
    -- Event-specific fields
    "eventItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Legacy fields for backward compatibility
    "eventName" TEXT,
    "registrationLink" TEXT,
    "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    CONSTRAINT "ProductDigitalSignWorkforceStuff_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on digitalSignId (1:1 with ProductDigitalSign)
CREATE UNIQUE INDEX "ProductDigitalSignWorkforceStuff_digitalSignId_key" ON "ProductDigitalSignWorkforceStuff"("digitalSignId");

-- Create indexes for efficient queries
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyEventId_idx" ON "ProductDigitalSignWorkforceStuff"("companyEventId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyTrainingId_idx" ON "ProductDigitalSignWorkforceStuff"("companyTrainingId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyCampaignId_idx" ON "ProductDigitalSignWorkforceStuff"("companyCampaignId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyBenefitsId_idx" ON "ProductDigitalSignWorkforceStuff"("companyBenefitsId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyCareerId_idx" ON "ProductDigitalSignWorkforceStuff"("companyCareerId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyCommunityId_idx" ON "ProductDigitalSignWorkforceStuff"("companyCommunityId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyImpactEventId_idx" ON "ProductDigitalSignWorkforceStuff"("companyImpactEventId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyEmployeeCauseId_idx" ON "ProductDigitalSignWorkforceStuff"("companyEmployeeCauseId");
CREATE INDEX "ProductDigitalSignWorkforceStuff_companyLeaderEngagementId_idx" ON "ProductDigitalSignWorkforceStuff"("companyLeaderEngagementId");

-- Add foreign key constraints
ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_digitalSignId_fkey" FOREIGN KEY ("digitalSignId") REFERENCES "ProductDigitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyEventId_fkey" FOREIGN KEY ("companyEventId") REFERENCES "CompanyEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyTrainingId_fkey" FOREIGN KEY ("companyTrainingId") REFERENCES "CompanyTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyCampaignId_fkey" FOREIGN KEY ("companyCampaignId") REFERENCES "CompanyCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyBenefitsId_fkey" FOREIGN KEY ("companyBenefitsId") REFERENCES "CompanyBenefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyCareerId_fkey" FOREIGN KEY ("companyCareerId") REFERENCES "CompanyCareer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyCommunityId_fkey" FOREIGN KEY ("companyCommunityId") REFERENCES "CompanyCommunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyImpactEventId_fkey" FOREIGN KEY ("companyImpactEventId") REFERENCES "CompanyImpactEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyEmployeeCauseId_fkey" FOREIGN KEY ("companyEmployeeCauseId") REFERENCES "CompanyEmployeeCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductDigitalSignWorkforceStuff" ADD CONSTRAINT "ProductDigitalSignWorkforceStuff_companyLeaderEngagementId_fkey" FOREIGN KEY ("companyLeaderEngagementId") REFERENCES "CompanyLeaderEngagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
