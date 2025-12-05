-- Migration: Fix Company Architecture
-- Remove CompanyAffiliation, add direct foreign keys to WorkMe
-- Make CompanyUnit.companyId nullable (it shouldn't be required)

-- Step 1: Make CompanyUnit.companyId nullable (if it exists and is required)
DO $$
BEGIN
  -- Check if companyId column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CompanyUnit' AND column_name = 'companyId' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "CompanyUnit" ALTER COLUMN "companyId" DROP NOT NULL;
  END IF;
END $$;

-- Step 2: Add new foreign key columns to WorkMe
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "companyUnitId" TEXT;
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "divisionId" TEXT;

-- Step 3: Add foreign key constraints to WorkMe
DO $$
BEGIN
  -- companyId → CompanyRegistry
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkMe_companyId_fkey'
  ) THEN
    ALTER TABLE "WorkMe" ADD CONSTRAINT "WorkMe_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "CompanyRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- companyUnitId → CompanyUnit
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkMe_companyUnitId_fkey'
  ) THEN
    ALTER TABLE "WorkMe" ADD CONSTRAINT "WorkMe_companyUnitId_fkey" 
    FOREIGN KEY ("companyUnitId") REFERENCES "CompanyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- divisionId → DivisionUnit
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkMe_divisionId_fkey'
  ) THEN
    ALTER TABLE "WorkMe" ADD CONSTRAINT "WorkMe_divisionId_fkey" 
    FOREIGN KEY ("divisionId") REFERENCES "DivisionUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 4: Create indexes on WorkMe
CREATE INDEX IF NOT EXISTS "WorkMe_companyId_idx" ON "WorkMe"("companyId");
CREATE INDEX IF NOT EXISTS "WorkMe_companyUnitId_idx" ON "WorkMe"("companyUnitId");
CREATE INDEX IF NOT EXISTS "WorkMe_divisionId_idx" ON "WorkMe"("divisionId");

-- Step 5: Drop CompanyAffiliation table if it exists
DROP TABLE IF EXISTS "CompanyAffiliation";

-- Step 6: Update reverse relations - add WorkMe relation to CompanyRegistry
-- (This is handled by Prisma relations, but we need to ensure the table structure supports it)
-- CompanyRegistry.members relation will work automatically via WorkMe.companyId

-- Step 7: Update reverse relations - ensure CompanyUnit.members works
-- (This is handled by Prisma relations via WorkMe.companyUnitId)

-- Step 8: Update reverse relations - ensure DivisionUnit.members works
-- (This is handled by Prisma relations via WorkMe.divisionId)

