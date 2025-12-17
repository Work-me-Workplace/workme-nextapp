-- AlterTable
ALTER TABLE "CompanyPlatformProduct" RENAME COLUMN "programCode" TO "platformSeries";

-- AlterTable
ALTER TABLE "CompanyPlatformProduct" ADD COLUMN "totalLength" TEXT,
ADD COLUMN "totalBeam" TEXT,
ADD COLUMN "totalDisplacementSubmerged" TEXT,
ADD COLUMN "totalManpowerNeeds" TEXT,
ADD COLUMN "totalTimeToBuild" TEXT,
ADD COLUMN "totalEstimatedCostPerUnit" TEXT,
ADD COLUMN "sensors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "defenseBuilders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "unitsInSeries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "yearsSinceLastInClass" INTEGER;

-- DropIndex
DROP INDEX IF EXISTS "CompanyPlatformProduct_programCode_idx";

-- CreateIndex
CREATE INDEX "CompanyPlatformProduct_platformSeries_idx" ON "CompanyPlatformProduct"("platformSeries");





