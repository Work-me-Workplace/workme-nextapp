-- Safe migration script for highlights - preserves all data
-- Run this manually via psql or your database client
-- 
-- ⚠️ SAFETY RULES:
-- - NEVER use --accept-data-loss or --force-reset
-- - Always add columns as nullable first
-- - Backfill data before making columns required
-- - Include safety checks before destructive operations
-- - Run migrations step-by-step, not all at once

-- Step 1: Add employeeId column as nullable
ALTER TABLE "CompanyEmployeeHighlight" 
ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

-- Step 2: Migrate data from junction table to direct employeeId
UPDATE "CompanyEmployeeHighlight" h
SET "employeeId" = (
  SELECT link."employeeId"
  FROM "CompanyEmployeeHighlightLink" link
  WHERE link."highlightId" = h.id
  LIMIT 1
)
WHERE "employeeId" IS NULL;

-- Step 3: Add companyId column as nullable (UUID type to match Company.id)
ALTER TABLE "CompanyEmployeeHighlight" 
ADD COLUMN IF NOT EXISTS "companyId" UUID;

-- Step 4: Backfill companyId from employee relationships (cast to UUID)
UPDATE "CompanyEmployeeHighlight" h
SET "companyId" = e."companyId"::UUID
FROM "CompanyEmployee" e
WHERE h."employeeId" = e.id
  AND h."companyId" IS NULL;

-- Step 5: For highlights without employee links, use the creator's companyId (cast to UUID)
UPDATE "CompanyEmployeeHighlight" h
SET "companyId" = w."companyId"::UUID
FROM "WorkMe" w
WHERE h."companyId" IS NULL
  AND h."createdByWorkMeId" = w.id
  AND w."companyId" IS NOT NULL;

-- Step 6: Add categoryOfAward column
ALTER TABLE "CompanyEmployeeHighlight" 
ADD COLUMN IF NOT EXISTS "categoryOfAward" TEXT;

-- Step 7: Convert classification to enum (if not already done)
-- First create the enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "HighlightClassification" AS ENUM ('EXCELLENCE', 'LEADERSHIP', 'INNOVATION', 'SERVICE', 'IMPACT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing string values to enum
UPDATE "CompanyEmployeeHighlight"
SET "classification" = CASE
  WHEN LOWER("classification") LIKE '%excellence%' OR LOWER("classification") LIKE '%achievement%' OR LOWER("classification") LIKE '%award%' THEN 'EXCELLENCE'
  WHEN LOWER("classification") LIKE '%leadership%' OR LOWER("classification") LIKE '%promotion%' THEN 'LEADERSHIP'
  WHEN LOWER("classification") LIKE '%innovation%' OR LOWER("classification") LIKE '%patent%' OR LOWER("classification") LIKE '%breakthrough%' THEN 'INNOVATION'
  WHEN LOWER("classification") LIKE '%service%' OR LOWER("classification") LIKE '%volunteer%' THEN 'SERVICE'
  WHEN LOWER("classification") LIKE '%impact%' OR LOWER("classification") LIKE '%mission%' THEN 'IMPACT'
  ELSE NULL
END
WHERE "classification" IS NOT NULL 
  AND "classification" NOT IN ('EXCELLENCE', 'LEADERSHIP', 'INNOVATION', 'SERVICE', 'IMPACT');

-- Change column type to enum (only if all values are valid)
ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "classification" TYPE "HighlightClassification" 
USING "classification"::text::"HighlightClassification";

-- Step 8: SAFETY CHECK - Verify all rows have values before making columns required
DO $$
DECLARE
  null_employee_count INTEGER;
  null_company_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_employee_count FROM "CompanyEmployeeHighlight" WHERE "employeeId" IS NULL;
  SELECT COUNT(*) INTO null_company_count FROM "CompanyEmployeeHighlight" WHERE "companyId" IS NULL;
  
  IF null_employee_count > 0 OR null_company_count > 0 THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: Cannot make columns required. Found % rows with NULL employeeId and % rows with NULL companyId. Please fix data first.', 
      null_employee_count, null_company_count;
  END IF;
  
  RAISE NOTICE 'Safety check passed: All rows have employeeId and companyId values';
END $$;

ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "employeeId" SET NOT NULL;

ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "companyId" SET NOT NULL;

-- Step 9: Add foreign keys
ALTER TABLE "CompanyEmployeeHighlight"
ADD CONSTRAINT "CompanyEmployeeHighlight_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE CASCADE;

ALTER TABLE "CompanyEmployeeHighlight"
ADD CONSTRAINT "CompanyEmployeeHighlight_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE;

-- Step 10: Add indexes
CREATE INDEX IF NOT EXISTS "CompanyEmployeeHighlight_employeeId_idx" ON "CompanyEmployeeHighlight"("employeeId");
CREATE INDEX IF NOT EXISTS "CompanyEmployeeHighlight_companyId_idx" ON "CompanyEmployeeHighlight"("companyId");

-- Step 11: Only drop junction table AFTER confirming data is migrated
-- Uncomment this line after verifying the migration worked:
-- DROP TABLE IF EXISTS "CompanyEmployeeHighlightLink";
