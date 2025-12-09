-- CreateEnum (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContextType') THEN
        CREATE TYPE "ContextType" AS ENUM ('campaign', 'impact_event', 'training', 'event', 'community', 'benefits', 'career', 'employee_cause');
    END IF;
END $$;

-- AlterTable: Convert WorkContext.type from String to ContextType enum (only if table exists)
-- First, verify all existing values are valid enum values
-- Then convert the column type

DO $$
BEGIN
  -- Only proceed if WorkContext table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkContext') THEN
    -- Step 1: Ensure all existing type values match enum values (they should already)
    IF EXISTS (
      SELECT 1 
      FROM "WorkContext" 
      WHERE "type" NOT IN ('campaign', 'impact_event', 'training', 'event', 'community', 'benefits', 'career', 'employee_cause')
    ) THEN
      RAISE EXCEPTION 'Invalid type values found in WorkContext table. Cannot migrate.';
    END IF;

    -- Step 2: Alter the column type from TEXT/VARCHAR to ContextType enum
    ALTER TABLE "WorkContext" 
      ALTER COLUMN "type" TYPE "ContextType" 
      USING "type"::"ContextType";
  END IF;
END $$;

