-- AlterTable: Update CompanyUnit to match new schema (remove domain, change id to uuid)
-- Note: This assumes CompanyUnit table exists. If not, create it.
DO $$
BEGIN
  -- Check if CompanyUnit table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CompanyUnit') THEN
    -- Remove domain column if it exists
    ALTER TABLE "CompanyUnit" DROP COLUMN IF EXISTS "domain";
    
    -- Note: Changing id type from cuid to uuid requires data migration
    -- For now, we'll keep the existing id type to avoid breaking existing data
  ELSE
    -- Create CompanyUnit table if it doesn't exist
    CREATE TABLE "CompanyUnit" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "CompanyUnit_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "CompanyUnit_name_key" ON "CompanyUnit"("name");
    CREATE INDEX "CompanyUnit_name_idx" ON "CompanyUnit"("name");
  END IF;
END $$;

-- Create DivisionUnit table
CREATE TABLE IF NOT EXISTS "DivisionUnit" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "companyUnitId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DivisionUnit_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for DivisionUnit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DivisionUnit_companyUnitId_fkey'
  ) THEN
    ALTER TABLE "DivisionUnit" ADD CONSTRAINT "DivisionUnit_companyUnitId_fkey" 
    FOREIGN KEY ("companyUnitId") REFERENCES "CompanyUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create unique constraint on DivisionUnit (name + companyUnitId)
CREATE UNIQUE INDEX IF NOT EXISTS "DivisionUnit_name_companyUnitId_key" ON "DivisionUnit"("name", "companyUnitId");
CREATE INDEX IF NOT EXISTS "DivisionUnit_companyUnitId_idx" ON "DivisionUnit"("companyUnitId");

-- AlterTable: Add companyUnitId and divisionUnitId to WorkProfile
ALTER TABLE "WorkProfile" ADD COLUMN IF NOT EXISTS "companyUnitId" TEXT;
ALTER TABLE "WorkProfile" ADD COLUMN IF NOT EXISTS "divisionUnitId" TEXT;

-- Add foreign key constraints for WorkProfile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkProfile_companyUnitId_fkey'
  ) THEN
    ALTER TABLE "WorkProfile" ADD CONSTRAINT "WorkProfile_companyUnitId_fkey" 
    FOREIGN KEY ("companyUnitId") REFERENCES "CompanyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkProfile_divisionUnitId_fkey'
  ) THEN
    ALTER TABLE "WorkProfile" ADD CONSTRAINT "WorkProfile_divisionUnitId_fkey" 
    FOREIGN KEY ("divisionUnitId") REFERENCES "DivisionUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Create indexes on WorkProfile
CREATE INDEX IF NOT EXISTS "WorkProfile_companyUnitId_idx" ON "WorkProfile"("companyUnitId");
CREATE INDEX IF NOT EXISTS "WorkProfile_divisionUnitId_idx" ON "WorkProfile"("divisionUnitId");
