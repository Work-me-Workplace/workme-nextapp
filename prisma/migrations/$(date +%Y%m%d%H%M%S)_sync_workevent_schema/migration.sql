-- Sync WorkEvent table with Prisma schema
-- Add all missing columns from the refactored WorkEvent model

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

-- Note: speakers, eventDate, startTime, endTime, eventCategory, registrationRequired, 
-- registrationLink, foodProvided, foodTypes, pocEmail, pocPhone should already exist
-- If any are missing, add them:

-- Add eventDate if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);

-- Add startTime if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "startTime" TEXT;

-- Add endTime if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "endTime" TEXT;

-- Add eventCategory if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;

-- Add registrationRequired if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "registrationRequired" TEXT;

-- Add registrationLink if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "registrationLink" TEXT;

-- Add foodProvided if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "foodProvided" TEXT;

-- Add foodTypes if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "foodTypes" TEXT;

-- Add speakers array if missing (default empty array)
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "speakers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add pocEmail if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "pocEmail" TEXT;

-- Add pocPhone if missing
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "pocPhone" TEXT;

-- Ensure description exists (should already exist)
ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "description" TEXT;

