-- Create enums for EventAudience and EventCategory (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventAudience') THEN
        CREATE TYPE "EventAudience" AS ENUM ('ALL_WORKFORCE', 'LEADERS', 'WORKFORCE_AND_FAMILIES', 'COMMUNITY');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventCategory') THEN
        CREATE TYPE "EventCategory" AS ENUM ('CELEBRATION', 'HERITAGE', 'COMMUNITY', 'RECOGNITION', 'APPRECIATION', 'FAMILY');
    END IF;
END $$;

-- Alter WorkEvent table to use enum types (only if table exists - WorkEvent may have been refactored)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkEvent') THEN
        -- Add temporary columns with enum types
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "audience_enum" "EventAudience";
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "eventCategory_enum" "EventCategory";

        -- Migrate existing data (if any exists)
        -- Map common string variations to enum values
        UPDATE "WorkEvent" SET 
          "audience_enum" = CASE 
            WHEN LOWER("audience") LIKE '%all%workforce%' OR LOWER("audience") LIKE '%all%employee%' OR LOWER("audience") LIKE '%workforce%' THEN 'ALL_WORKFORCE'::"EventAudience"
            WHEN LOWER("audience") LIKE '%leader%' OR LOWER("audience") LIKE '%supervisor%' OR LOWER("audience") LIKE '%command%' THEN 'LEADERS'::"EventAudience"
            WHEN LOWER("audience") LIKE '%family%' OR LOWER("audience") LIKE '%open%house%' OR LOWER("audience") LIKE '%kids%' THEN 'WORKFORCE_AND_FAMILIES'::"EventAudience"
            WHEN LOWER("audience") LIKE '%community%' OR LOWER("audience") LIKE '%partner%' OR LOWER("audience") LIKE '%visitor%' THEN 'COMMUNITY'::"EventAudience"
            ELSE NULL
          END
        WHERE "audience" IS NOT NULL;

        UPDATE "WorkEvent" SET 
          "eventCategory_enum" = CASE 
            WHEN LOWER("eventCategory") LIKE '%celebration%' OR LOWER("eventCategory") LIKE '%holiday%' THEN 'CELEBRATION'::"EventCategory"
            WHEN LOWER("eventCategory") LIKE '%heritage%' OR LOWER("eventCategory") LIKE '%dei%' OR LOWER("eventCategory") LIKE '%cultural%' THEN 'HERITAGE'::"EventCategory"
            WHEN LOWER("eventCategory") LIKE '%community%' OR LOWER("eventCategory") LIKE '%outreach%' OR LOWER("eventCategory") LIKE '%impact%' THEN 'COMMUNITY'::"EventCategory"
            WHEN LOWER("eventCategory") LIKE '%recognition%' OR LOWER("eventCategory") LIKE '%award%' THEN 'RECOGNITION'::"EventCategory"
            WHEN LOWER("eventCategory") LIKE '%appreciation%' OR LOWER("eventCategory") LIKE '%thank%' OR LOWER("eventCategory") LIKE '%morale%' THEN 'APPRECIATION'::"EventCategory"
            WHEN LOWER("eventCategory") LIKE '%family%' THEN 'FAMILY'::"EventCategory"
            ELSE NULL
          END
        WHERE "eventCategory" IS NOT NULL;

        -- Drop old columns
        ALTER TABLE "WorkEvent" DROP COLUMN IF EXISTS "audience";
        ALTER TABLE "WorkEvent" DROP COLUMN IF EXISTS "eventCategory";

        -- Rename enum columns to final names
        ALTER TABLE "WorkEvent" RENAME COLUMN "audience_enum" TO "audience";
        ALTER TABLE "WorkEvent" RENAME COLUMN "eventCategory_enum" TO "eventCategory";
    END IF;
END $$;

