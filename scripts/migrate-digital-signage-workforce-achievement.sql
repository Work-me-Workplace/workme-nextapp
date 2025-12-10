-- ============================================
-- Migration: ProductDigitalSignWorkforceAchievement Refactor
-- ============================================
-- 
-- This migration refactors ProductDigitalSignWorkforceAchievement from:
--   OLD: personName, unit, achievement, details
--   NEW: headline, subhead, detailBlock, runtimeGuidance, imageAssetId, employeeId, highlightId
--
-- SAFETY: This is a breaking change. Old data will be migrated where possible.
-- ============================================

-- Step 1: Add new columns as nullable (safe - no data loss)
ALTER TABLE "ProductDigitalSignWorkforceAchievement" 
  ADD COLUMN IF NOT EXISTS "headline" TEXT,
  ADD COLUMN IF NOT EXISTS "subhead" TEXT,
  ADD COLUMN IF NOT EXISTS "detailBlock" TEXT,
  ADD COLUMN IF NOT EXISTS "runtimeGuidance" TEXT,
  ADD COLUMN IF NOT EXISTS "imageAssetId" TEXT,
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "highlightId" TEXT;

-- Step 2: Migrate existing data to new structure
-- Convert personName + achievement → headline
-- Convert achievement → subhead (simplified)
-- Convert details → detailBlock
-- Set default runtimeGuidance
UPDATE "ProductDigitalSignWorkforceAchievement"
SET 
  "headline" = COALESCE(
    "personName" || ' — ' || LEFT("achievement", 50),
    "personName" || ' — Recognition',
    'Employee Recognition'
  ),
  "subhead" = COALESCE(
    "achievement",
    NULL
  ),
  "detailBlock" = COALESCE(
    "details",
    NULL
  ),
  "runtimeGuidance" = '1 week'
WHERE "headline" IS NULL;

-- Step 3: Create indexes for new foreign key columns (before adding constraints)
CREATE INDEX IF NOT EXISTS "ProductDigitalSignWorkforceAchievement_employeeId_idx" 
  ON "ProductDigitalSignWorkforceAchievement"("employeeId");
CREATE INDEX IF NOT EXISTS "ProductDigitalSignWorkforceAchievement_highlightId_idx" 
  ON "ProductDigitalSignWorkforceAchievement"("highlightId");

-- Step 4: Add foreign key constraint for imageAssetId (if Asset table exists)
-- Note: This assumes the Asset table exists. If not, this will fail gracefully.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset') THEN
    -- Add foreign key constraint for imageAssetId
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'ProductDigitalSignWorkforceAchievement_imageAssetId_fkey'
    ) THEN
      ALTER TABLE "ProductDigitalSignWorkforceAchievement"
        ADD CONSTRAINT "ProductDigitalSignWorkforceAchievement_imageAssetId_fkey"
        FOREIGN KEY ("imageAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Step 5: Safety check - verify all rows have headline (required field)
DO $$ 
DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM "ProductDigitalSignWorkforceAchievement" 
  WHERE "headline" IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Safety check failed: % rows still have NULL headline. Cannot make headline required.', null_count;
  END IF;
END $$;

-- Step 6: Make headline required (only after safety check passes)
ALTER TABLE "ProductDigitalSignWorkforceAchievement"
  ALTER COLUMN "headline" SET NOT NULL;

-- Step 7: Drop old columns (ONLY after confirming new structure works)
-- ⚠️ UNCOMMENT THESE LINES ONLY AFTER VERIFYING THE MIGRATION WORKS IN DEV/TEST
-- 
-- ALTER TABLE "ProductDigitalSignWorkforceAchievement"
--   DROP COLUMN IF EXISTS "personName",
--   DROP COLUMN IF EXISTS "unit",
--   DROP COLUMN IF EXISTS "achievement",
--   DROP COLUMN IF EXISTS "details";

-- ============================================
-- Migration Complete
-- ============================================
-- 
-- Next steps:
-- 1. Test the application with new structure
-- 2. Verify all existing records have proper headline values
-- 3. Once confirmed, uncomment Step 7 to drop old columns
-- 4. Run: npx prisma generate (to update Prisma Client types)
-- ============================================
