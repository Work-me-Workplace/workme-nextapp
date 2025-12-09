CREATE TABLE "XFeedFollow" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "XFeedFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platformType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isNextGen" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "description" TEXT,
    "latestSignal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCapability" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCommNode" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "nodeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCommNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemDefenseCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "hqCity" TEXT,
    "hqState" TEXT,
    "hqCountry" TEXT,
    "role" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketTier" TEXT,
    "influenceScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcosystemDefenseCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformContract" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "prime" BOOLEAN NOT NULL DEFAULT false,
    "onContract" BOOLEAN NOT NULL DEFAULT false,
    "contractNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSignal" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" TEXT,
    "signalType" TEXT NOT NULL,
    "headline" TEXT,
    "rawSnippet" TEXT,
    "aiSummary" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkMeEcosystemCompany" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkMeEcosystemCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemPerson" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "xHandle" TEXT,
    "title" TEXT,
    "seniority" TEXT,
    "domain" TEXT,
    "beat" TEXT,
    "companyName" TEXT,
    "yearsAt" INTEGER,
    "influence" INTEGER,
    "updatedSummary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcosystemPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "type" TEXT,
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcosystemCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyEcosystemContact" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "personId" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyEcosystemContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EcosystemCompanyPlatforms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex (only if columns exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkEntry') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'WorkEntry' AND column_name = 'workMeId') THEN
            CREATE INDEX IF NOT EXISTS "WorkEntry_workMeId_idx" ON "WorkEntry"("workMeId");
        END IF;
        CREATE INDEX IF NOT EXISTS "WorkEntry_startDate_idx" ON "WorkEntry"("startDate");
        CREATE INDEX IF NOT EXISTS "WorkEntry_endDate_idx" ON "WorkEntry"("endDate");
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkSkills') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'WorkSkills' AND column_name = 'workMeId') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "WorkSkills_workMeId_key" ON "WorkSkills"("workMeId");
            CREATE INDEX IF NOT EXISTS "WorkSkills_workMeId_idx" ON "WorkSkills"("workMeId");
        END IF;
    END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUnitHierarchy_unit_key" ON "CompanyUnitHierarchy"("unit");

-- CreateIndex
CREATE INDEX "CompanyUnitHierarchy_companyId_idx" ON "CompanyUnitHierarchy"("companyId");

-- CreateIndex
CREATE INDEX "CompanyUnitHierarchy_parentUnitId_idx" ON "CompanyUnitHierarchy"("parentUnitId");

-- CreateIndex
CREATE INDEX "CompanyUnitHierarchy_unit_idx" ON "CompanyUnitHierarchy"("unit");

-- CreateIndex
CREATE INDEX "WorkOutlookItem_workMeId_idx" ON "WorkOutlookItem"("workMeId");

-- CreateIndex
CREATE INDEX "WorkOutlookItem_date_idx" ON "WorkOutlookItem"("date");

-- CreateIndex
CREATE INDEX "WorkOutlookItem_status_idx" ON "WorkOutlookItem"("status");

-- CreateIndex
CREATE INDEX "WorkGoal_workMeId_idx" ON "WorkGoal"("workMeId");

-- CreateIndex
CREATE INDEX "WorkGoal_targetDate_idx" ON "WorkGoal"("targetDate");

-- CreateIndex
CREATE INDEX "XFeedFollow_workMeId_idx" ON "XFeedFollow"("workMeId");

-- CreateIndex
CREATE INDEX "XFeedFollow_type_idx" ON "XFeedFollow"("type");

-- CreateIndex
CREATE INDEX "XFeedFollow_handle_idx" ON "XFeedFollow"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "XFeedFollow_workMeId_type_displayName_key" ON "XFeedFollow"("workMeId", "type", "displayName");

-- CreateIndex
CREATE INDEX "Platform_platformType_idx" ON "Platform"("platformType");

-- CreateIndex
CREATE INDEX "Platform_category_idx" ON "Platform"("category");

-- CreateIndex
CREATE INDEX "PlatformCapability_platformId_idx" ON "PlatformCapability"("platformId");

-- CreateIndex
CREATE INDEX "PlatformCapability_capability_idx" ON "PlatformCapability"("capability");

-- CreateIndex
CREATE INDEX "PlatformCommNode_platformId_idx" ON "PlatformCommNode"("platformId");

-- CreateIndex
CREATE INDEX "PlatformCommNode_nodeType_idx" ON "PlatformCommNode"("nodeType");

-- CreateIndex
CREATE INDEX "EcosystemDefenseCompany_name_idx" ON "EcosystemDefenseCompany"("name");

-- CreateIndex
CREATE INDEX "EcosystemDefenseCompany_role_idx" ON "EcosystemDefenseCompany"("role");

-- CreateIndex
CREATE INDEX "PlatformContract_platformId_idx" ON "PlatformContract"("platformId");

-- CreateIndex
CREATE INDEX "PlatformContract_companyId_idx" ON "PlatformContract"("companyId");

-- CreateIndex
CREATE INDEX "PlatformSignal_platformId_idx" ON "PlatformSignal"("platformId");

-- CreateIndex
CREATE INDEX "PlatformSignal_signalType_idx" ON "PlatformSignal"("signalType");

-- CreateIndex
CREATE INDEX "PlatformSignal_createdAt_idx" ON "PlatformSignal"("createdAt");

-- CreateIndex
CREATE INDEX "WorkMeEcosystemCompany_workMeId_idx" ON "WorkMeEcosystemCompany"("workMeId");

-- CreateIndex
CREATE INDEX "WorkMeEcosystemCompany_companyId_idx" ON "WorkMeEcosystemCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkMeEcosystemCompany_workMeId_companyId_key" ON "WorkMeEcosystemCompany"("workMeId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemPerson_xHandle_key" ON "EcosystemPerson"("xHandle");

-- CreateIndex
CREATE INDEX "EcosystemPerson_xHandle_idx" ON "EcosystemPerson"("xHandle");

-- CreateIndex
CREATE INDEX "EcosystemPerson_domain_idx" ON "EcosystemPerson"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemCompany_domain_key" ON "EcosystemCompany"("domain");

-- CreateIndex
CREATE INDEX "EcosystemCompany_name_idx" ON "EcosystemCompany"("name");

-- CreateIndex
CREATE INDEX "EcosystemCompany_type_idx" ON "EcosystemCompany"("type");

-- CreateIndex
CREATE INDEX "MyEcosystemContact_workMeId_idx" ON "MyEcosystemContact"("workMeId");

-- CreateIndex
CREATE INDEX "MyEcosystemContact_personId_idx" ON "MyEcosystemContact"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "MyEcosystemContact_workMeId_personId_key" ON "MyEcosystemContact"("workMeId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "_EcosystemCompanyPlatforms_AB_unique" ON "_EcosystemCompanyPlatforms"("A", "B");

-- CreateIndex
CREATE INDEX "_EcosystemCompanyPlatforms_B_index" ON "_EcosystemCompanyPlatforms"("B");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUnit_name_key" ON "CompanyUnit"("name");

-- CreateIndex
CREATE INDEX "CompanyUnit_name_idx" ON "CompanyUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkMe_handle_key" ON "WorkMe"("handle");

-- CreateIndex
CREATE INDEX "WorkMe_handle_idx" ON "WorkMe"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "WorkProfile_workMeId_key" ON "WorkProfile"("workMeId");

-- CreateIndex (only if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkProfile') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'WorkProfile' AND column_name = 'workMeId') THEN
            CREATE INDEX IF NOT EXISTS "WorkProfile_workMeId_idx" ON "WorkProfile"("workMeId");
        END IF;
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "WorkProfile" ADD CONSTRAINT "WorkProfile_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntry" ADD CONSTRAINT "WorkEntry_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSkills" ADD CONSTRAINT "WorkSkills_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUnitHierarchy" ADD CONSTRAINT "CompanyUnitHierarchy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUnitHierarchy" ADD CONSTRAINT "CompanyUnitHierarchy_parentUnitId_fkey" FOREIGN KEY ("parentUnitId") REFERENCES "CompanyUnitHierarchy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUnitMembers" ADD CONSTRAINT "CompanyUnitMembers_companyUnit_fkey" FOREIGN KEY ("companyUnit") REFERENCES "CompanyUnitHierarchy"("unit") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyWorkOutlook" ADD CONSTRAINT "MyWorkOutlook_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyWorkItem" ADD CONSTRAINT "MyWorkItem_outlookId_fkey" FOREIGN KEY ("outlookId") REFERENCES "MyWorkOutlook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminWorkItem" ADD CONSTRAINT "AdminWorkItem_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOutlookItem" ADD CONSTRAINT "WorkOutlookItem_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGoal" ADD CONSTRAINT "WorkGoal_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XFeedFollow" ADD CONSTRAINT "XFeedFollow_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCapability" ADD CONSTRAINT "PlatformCapability_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCommNode" ADD CONSTRAINT "PlatformCommNode_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformContract" ADD CONSTRAINT "PlatformContract_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformContract" ADD CONSTRAINT "PlatformContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "EcosystemDefenseCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSignal" ADD CONSTRAINT "PlatformSignal_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMeEcosystemCompany" ADD CONSTRAINT "WorkMeEcosystemCompany_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMeEcosystemCompany" ADD CONSTRAINT "WorkMeEcosystemCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "EcosystemDefenseCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyEcosystemContact" ADD CONSTRAINT "MyEcosystemContact_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyEcosystemContact" ADD CONSTRAINT "MyEcosystemContact_personId_fkey" FOREIGN KEY ("personId") REFERENCES "EcosystemPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EcosystemCompanyPlatforms" ADD CONSTRAINT "_EcosystemCompanyPlatforms_A_fkey" FOREIGN KEY ("A") REFERENCES "EcosystemDefenseCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EcosystemCompanyPlatforms" ADD CONSTRAINT "_EcosystemCompanyPlatforms_B_fkey" FOREIGN KEY ("B") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
