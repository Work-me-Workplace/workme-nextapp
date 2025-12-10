-- Step 1: Add employeeId column to CompanyEmployeeHighlight (nullable first)
ALTER TABLE "CompanyEmployeeHighlight" 
ADD COLUMN "employeeId" TEXT;

-- Step 2: Migrate data from junction table to direct employeeId
UPDATE "CompanyEmployeeHighlight" h
SET "employeeId" = (
  SELECT link."employeeId"
  FROM "CompanyEmployeeHighlightLink" link
  WHERE link."highlightId" = h.id
  LIMIT 1
)
WHERE "employeeId" IS NULL;

-- Step 2b: For any highlights without employee links, try to get from creator's context
-- (This is a fallback - ideally all highlights should have employee links)
UPDATE "CompanyEmployeeHighlight" h
SET "employeeId" = (
  SELECT e.id
  FROM "CompanyEmployee" e
  WHERE e."companyId" = (
    SELECT w."companyId"
    FROM "WorkMe" w
    WHERE w.id = h."createdByWorkMeId"
  )
  LIMIT 1
)
WHERE "employeeId" IS NULL;

-- Step 3: Add companyId column
ALTER TABLE "CompanyEmployeeHighlight" 
ADD COLUMN "companyId" UUID;

-- Step 4: Backfill companyId from employee relationships
UPDATE "CompanyEmployeeHighlight" h
SET "companyId" = e."companyId"
FROM "CompanyEmployee" e
WHERE h."employeeId" = e.id
  AND h."companyId" IS NULL;

-- Step 5: For highlights without employee links, use the creator's companyId
UPDATE "CompanyEmployeeHighlight" h
SET "companyId" = w."companyId"
FROM "WorkMe" w
WHERE h."companyId" IS NULL
  AND h."createdByWorkMeId" = w.id
  AND w."companyId" IS NOT NULL;

-- Step 6: Make columns required and add foreign keys
ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "employeeId" SET NOT NULL;

ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "CompanyEmployeeHighlight"
ADD CONSTRAINT "CompanyEmployeeHighlight_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE CASCADE;

ALTER TABLE "CompanyEmployeeHighlight"
ADD CONSTRAINT "CompanyEmployeeHighlight_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE;

-- Step 7: Add indexes
CREATE INDEX "CompanyEmployeeHighlight_employeeId_idx" ON "CompanyEmployeeHighlight"("employeeId");
CREATE INDEX "CompanyEmployeeHighlight_companyId_idx" ON "CompanyEmployeeHighlight"("companyId");

-- Step 8: Drop the junction table (no longer needed)
DROP TABLE IF EXISTS "CompanyEmployeeHighlightLink";
