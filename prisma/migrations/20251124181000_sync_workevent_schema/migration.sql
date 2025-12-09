-- Sync WorkEvent table with Prisma schema (only if table exists - WorkEvent may have been refactored)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkEvent') THEN
        -- Add theme column (NEW - tagline/theme)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "theme" TEXT;

        -- Add audience column (NEW - highlights from GPT)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "audience" TEXT;

        -- Add vibe column (NEW - highlights from GPT)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "vibe" TEXT;

        -- Add perks array column (NEW - highlights from GPT)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "perks" TEXT[] DEFAULT ARRAY[]::TEXT[];

        -- Add participation array column (NEW - highlights from GPT)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "participation" TEXT[] DEFAULT ARRAY[]::TEXT[];

        -- Ensure all required columns exist (add if missing)
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "endTime" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "registrationRequired" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "registrationLink" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "foodProvided" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "foodTypes" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "speakers" TEXT[] DEFAULT ARRAY[]::TEXT[];
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "pocEmail" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "pocPhone" TEXT;
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "description" TEXT;
    END IF;
END $$;

