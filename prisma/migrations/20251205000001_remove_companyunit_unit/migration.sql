-- Migration: Remove CompanyUnit.unit column
-- The database has a required 'unit' column that doesn't exist in Prisma schema

-- Step 1: Drop foreign key constraint from CompanyUnitMembers that references CompanyUnit.unit
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUnitMembers_companyUnit_fkey'
  ) THEN
    ALTER TABLE "CompanyUnitMembers" DROP CONSTRAINT "CompanyUnitMembers_companyUnit_fkey";
  END IF;
END $$;

-- Step 2: Drop any constraints on CompanyUnit.unit column
DO $$
BEGIN
  -- Drop unique constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUnit_unit_key'
  ) THEN
    ALTER TABLE "CompanyUnit" DROP CONSTRAINT "CompanyUnit_unit_key";
  END IF;
  
  -- Drop foreign key constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUnit_unit_fkey'
  ) THEN
    ALTER TABLE "CompanyUnit" DROP CONSTRAINT "CompanyUnit_unit_fkey";
  END IF;
END $$;

-- Step 3: Drop indexes on unit
DROP INDEX IF EXISTS "CompanyUnit_unit_idx";

-- Step 4: Drop the unit column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CompanyUnit' AND column_name = 'unit'
  ) THEN
    ALTER TABLE "CompanyUnit" DROP COLUMN "unit";
  END IF;
END $$;

