-- Rename signageId to digitalSignId in all ProductDigitalSign related tables
-- Also remove DesignWorkPackageAsset table

-- ProductDigitalSignWorkforce
ALTER TABLE "ProductDigitalSignWorkforce" RENAME COLUMN "signageId" TO "digitalSignId";

-- ProductDigitalSignCompanyNews
ALTER TABLE "ProductDigitalSignCompanyNews" RENAME COLUMN "signageId" TO "digitalSignId";

-- ProductDigitalSignWorkforceAchievement
ALTER TABLE "ProductDigitalSignWorkforceAchievement" RENAME COLUMN "signageId" TO "digitalSignId";

-- ProductDigitalSignCompanyEvent
ALTER TABLE "ProductDigitalSignCompanyEvent" RENAME COLUMN "signageId" TO "digitalSignId";

-- DigitalSignAsset
ALTER TABLE "DigitalSignAsset" RENAME COLUMN "signageId" TO "digitalSignId";
DROP INDEX IF EXISTS "DigitalSignAsset_assetId_signageId_key";
CREATE UNIQUE INDEX "DigitalSignAsset_assetId_digitalSignId_key" ON "DigitalSignAsset"("assetId", "digitalSignId");

-- DesignWorkPackage
ALTER TABLE "DesignWorkPackage" RENAME COLUMN "signageId" TO "digitalSignId";
DROP INDEX IF EXISTS "DesignWorkPackage_signageId_idx";
CREATE INDEX IF NOT EXISTS "DesignWorkPackage_digitalSignId_idx" ON "DesignWorkPackage"("digitalSignId");

-- Drop DesignWorkPackageAsset table
DROP TABLE IF EXISTS "DesignWorkPackageAsset";
