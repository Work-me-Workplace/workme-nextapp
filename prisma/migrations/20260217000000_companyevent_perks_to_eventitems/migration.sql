-- Replace perks with eventItems on CompanyEvent
-- eventItems: highlights, agenda items, key moments (String[])

-- Add new column
ALTER TABLE "CompanyEvent" ADD COLUMN IF NOT EXISTS "eventItems" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing perks data into eventItems (preserve data)
UPDATE "CompanyEvent" SET "eventItems" = COALESCE("perks", ARRAY[]::TEXT[]);

-- Drop perks column
ALTER TABLE "CompanyEvent" DROP COLUMN IF EXISTS "perks";
