-- AlterTable: Remove deprecated 'block' field
ALTER TABLE "CompanyPlatformUnit" DROP COLUMN IF EXISTS "block";

-- AlterTable: Add Identity & Ordinal Context fields
ALTER TABLE "CompanyPlatformUnit" ADD COLUMN IF NOT EXISTS "numberInClass" INTEGER,
ADD COLUMN IF NOT EXISTS "platformClass" TEXT;

-- AlterTable: Add Industrial / Build Context fields
ALTER TABLE "CompanyPlatformUnit" ADD COLUMN IF NOT EXISTS "defenseContractor" TEXT,
ADD COLUMN IF NOT EXISTS "whereBuilt" TEXT,
ADD COLUMN IF NOT EXISTS "unitCost" TEXT;

-- AlterTable: Add Lifecycle Dates fields
ALTER TABLE "CompanyPlatformUnit" ADD COLUMN IF NOT EXISTS "constructionStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "constructionCompleteDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deliveryToFleetDate" TIMESTAMP(3);

-- AlterTable: Add Operational Context fields
ALTER TABLE "CompanyPlatformUnit" ADD COLUMN IF NOT EXISTS "homeport" TEXT,
ADD COLUMN IF NOT EXISTS "currentStatus" TEXT;

-- AlterTable: Add System / Creation Metadata field
ALTER TABLE "CompanyPlatformUnit" ADD COLUMN IF NOT EXISTS "createdVia" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyPlatformUnit_numberInClass_idx" ON "CompanyPlatformUnit"("numberInClass");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyPlatformUnit_platformClass_idx" ON "CompanyPlatformUnit"("platformClass");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyPlatformUnit_currentStatus_idx" ON "CompanyPlatformUnit"("currentStatus");






