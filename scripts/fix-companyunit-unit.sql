-- Drop foreign key constraint from CompanyUnitMembers that references CompanyUnit.unit
ALTER TABLE "CompanyUnitMembers" DROP CONSTRAINT IF EXISTS "CompanyUnitMembers_companyUnit_fkey";

-- Drop constraints on CompanyUnit.unit column
ALTER TABLE "CompanyUnit" DROP CONSTRAINT IF EXISTS "CompanyUnit_unit_key";
ALTER TABLE "CompanyUnit" DROP CONSTRAINT IF EXISTS "CompanyUnit_unit_fkey";

-- Drop indexes on unit
DROP INDEX IF EXISTS "CompanyUnit_unit_idx";

-- Drop the unit column
ALTER TABLE "CompanyUnit" DROP COLUMN IF EXISTS "unit";

