-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('campaign', 'impact_event', 'training', 'event', 'community', 'benefits', 'career', 'employee_cause');

-- AlterTable: Convert WorkContext.type from String to ContextType enum
-- First, verify all existing values are valid enum values
-- Then convert the column type

-- Step 1: Ensure all existing type values match enum values (they should already)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM "WorkContext" 
    WHERE "type" NOT IN ('campaign', 'impact_event', 'training', 'event', 'community', 'benefits', 'career', 'employee_cause')
  ) THEN
    RAISE EXCEPTION 'Invalid type values found in WorkContext table. Cannot migrate.';
  END IF;
END $$;

-- Step 2: Alter the column type from TEXT/VARCHAR to ContextType enum
ALTER TABLE "WorkContext" 
  ALTER COLUMN "type" TYPE "ContextType" 
  USING "type"::"ContextType";

