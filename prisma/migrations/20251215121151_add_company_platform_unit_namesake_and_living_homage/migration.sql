-- CreateTable
CREATE TABLE "CompanyPlatformUnitNamesake" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platformUnitId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "knownAs" TEXT,
    "role" TEXT,
    "whyKnown" TEXT,
    "legacySummary" TEXT,
    "era" TEXT,
    "honors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "CompanyPlatformUnitNamesake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPlatformUnitLivingHomage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platformUnitId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "relation" TEXT,
    "notes" TEXT,

    CONSTRAINT "CompanyPlatformUnitLivingHomage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPlatformUnitNamesake_platformUnitId_key" ON "CompanyPlatformUnitNamesake"("platformUnitId");

-- CreateIndex
CREATE INDEX "CompanyPlatformUnitNamesake_platformUnitId_idx" ON "CompanyPlatformUnitNamesake"("platformUnitId");

-- CreateIndex
CREATE INDEX "CompanyPlatformUnitNamesake_fullName_idx" ON "CompanyPlatformUnitNamesake"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPlatformUnitLivingHomage_platformUnitId_key" ON "CompanyPlatformUnitLivingHomage"("platformUnitId");

-- CreateIndex
CREATE INDEX "CompanyPlatformUnitLivingHomage_platformUnitId_idx" ON "CompanyPlatformUnitLivingHomage"("platformUnitId");

-- CreateIndex
CREATE INDEX "CompanyPlatformUnitLivingHomage_fullName_idx" ON "CompanyPlatformUnitLivingHomage"("fullName");

-- AddForeignKey
ALTER TABLE "CompanyPlatformUnitNamesake" ADD CONSTRAINT "CompanyPlatformUnitNamesake_platformUnitId_fkey" FOREIGN KEY ("platformUnitId") REFERENCES "CompanyPlatformUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPlatformUnitLivingHomage" ADD CONSTRAINT "CompanyPlatformUnitLivingHomage_platformUnitId_fkey" FOREIGN KEY ("platformUnitId") REFERENCES "CompanyPlatformUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;



