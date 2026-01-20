# Migration Guide: ExternalCompanyPressure Refactor

## Overview
This refactor updates the `ExternalCompanyPressure` model to:
- Add `title` field (replacing free-form source usage)
- Replace `category` (string) with `workforceConcern` (enum)
- Change `source` from string to enum
- Add `levelOfSeverity` field (0-5 integer)
- Update indexes accordingly

## Migration SQL

```sql
-- Create new enums
CREATE TYPE "PressureSource" AS ENUM (
  'CONGRESS',
  'OSD',
  'NAVSEA_LEADERSHIP',
  'PEO',
  'POLICY',
  'BUDGET',
  'GAO',
  'INDUSTRY',
  'OPERATIONS',
  'TECHNOLOGY',
  'CYBER'
);

CREATE TYPE "WorkforceConcernType" AS ENUM (
  'JOB_SECURITY',
  'ROLE_CLARITY',
  'FAIRNESS',
  'ADMIN_FRICTION',
  'TRUST_CREDIBILITY'
);

-- Step 1: Add new columns (nullable first for data migration)
ALTER TABLE "ExternalCompanyPressure" 
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "workforceConcern" "WorkforceConcernType",
  ADD COLUMN IF NOT EXISTS "levelOfSeverity" INTEGER,
  ADD COLUMN IF NOT EXISTS "source_new" "PressureSource";

-- Step 2: Migrate data
-- For source: You'll need to map existing string values to enum values
-- Example mapping logic (adjust based on your actual data):
UPDATE "ExternalCompanyPressure" 
SET "source_new" = CASE 
  WHEN UPPER("source") LIKE '%CONGRESS%' THEN 'CONGRESS'::"PressureSource"
  WHEN UPPER("source") LIKE '%GAO%' THEN 'GAO'::"PressureSource"
  WHEN UPPER("source") LIKE '%OSD%' THEN 'OSD'::"PressureSource"
  -- Add more mappings as needed
  ELSE 'GAO'::"PressureSource" -- Default fallback
END
WHERE "source_new" IS NULL;

-- For title: Use source as title if title is null
UPDATE "ExternalCompanyPressure" 
SET "title" = COALESCE("title", "source")
WHERE "title" IS NULL;

-- For workforceConcern: Set default (you may want to review each record)
UPDATE "ExternalCompanyPressure" 
SET "workforceConcern" = 'JOB_SECURITY'::"WorkforceConcernType"
WHERE "workforceConcern" IS NULL;

-- For levelOfSeverity: Set default to 2 (moderate)
UPDATE "ExternalCompanyPressure" 
SET "levelOfSeverity" = 2
WHERE "levelOfSeverity" IS NULL;

-- Step 3: Make new columns required (after data migration)
ALTER TABLE "ExternalCompanyPressure" 
  ALTER COLUMN "title" SET NOT NULL,
  ALTER COLUMN "workforceConcern" SET NOT NULL,
  ALTER COLUMN "levelOfSeverity" SET NOT NULL,
  ALTER COLUMN "source_new" SET NOT NULL;

-- Step 4: Drop old columns and constraints
DROP INDEX IF EXISTS "ExternalCompanyPressure_source_idx";
DROP INDEX IF EXISTS "ExternalCompanyPressure_category_idx";

ALTER TABLE "ExternalCompanyPressure" DROP COLUMN IF EXISTS "source";
ALTER TABLE "ExternalCompanyPressure" DROP COLUMN IF EXISTS "category";

-- Step 5: Rename source_new to source
ALTER TABLE "ExternalCompanyPressure" RENAME COLUMN "source_new" TO "source";

-- Step 6: Add new indexes
CREATE INDEX IF NOT EXISTS "ExternalCompanyPressure_source_idx" ON "ExternalCompanyPressure"("source");
CREATE INDEX IF NOT EXISTS "ExternalCompanyPressure_workforceConcern_idx" ON "ExternalCompanyPressure"("workforceConcern");
CREATE INDEX IF NOT EXISTS "ExternalCompanyPressure_levelOfSeverity_idx" ON "ExternalCompanyPressure"("levelOfSeverity");

-- Step 7: Add constraint for levelOfSeverity range (optional, but recommended)
ALTER TABLE "ExternalCompanyPressure" 
  ADD CONSTRAINT "ExternalCompanyPressure_levelOfSeverity_check" 
  CHECK ("levelOfSeverity" >= 0 AND "levelOfSeverity" <= 5);
```

## Important Notes

1. **Data Migration**: You'll need to manually review and map existing `source` string values to the new enum values. The example mapping above is a starting point.

2. **Workforce Concern**: You'll need to manually set `workforceConcern` for existing records based on the context. The default of `JOB_SECURITY` may not be appropriate for all records.

3. **Level of Severity**: The default of `2` (moderate) should be reviewed and adjusted per record.

4. **Title Field**: If you don't have title data, the migration uses `source` as the title. You may want to review and update these.

## After Migration

1. Run `npx prisma generate` to update Prisma client
2. Test all API endpoints
3. Verify UI displays correctly
4. Update any external integrations that use this model

## Rollback Plan

If you need to rollback:
1. Restore from backup
2. Or create a reverse migration that:
   - Adds back `category` and `source` as strings
   - Migrates data back
   - Drops the new columns and enums

