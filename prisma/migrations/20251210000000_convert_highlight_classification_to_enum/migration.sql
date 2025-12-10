-- Create the enum type (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HighlightClassification') THEN
    CREATE TYPE "HighlightClassification" AS ENUM ('EXCELLENCE', 'LEADERSHIP', 'INNOVATION', 'SERVICE', 'IMPACT');
  END IF;
END $$;

-- Only proceed if the table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'CompanyEmployeeHighlight'
  ) THEN
    -- Convert existing string values to enum values before changing column type
    EXECUTE '
      UPDATE "CompanyEmployeeHighlight"
      SET "classification" = CASE
        WHEN LOWER("classification") LIKE ''%excellence%'' OR LOWER("classification") LIKE ''%achievement%'' OR LOWER("classification") LIKE ''%award%'' THEN ''EXCELLENCE''
        WHEN LOWER("classification") LIKE ''%leadership%'' OR LOWER("classification") LIKE ''%promotion%'' THEN ''LEADERSHIP''
        WHEN LOWER("classification") LIKE ''%innovation%'' OR LOWER("classification") LIKE ''%patent%'' OR LOWER("classification") LIKE ''%breakthrough%'' THEN ''INNOVATION''
        WHEN LOWER("classification") LIKE ''%service%'' OR LOWER("classification") LIKE ''%volunteer%'' THEN ''SERVICE''
        WHEN LOWER("classification") LIKE ''%impact%'' OR LOWER("classification") LIKE ''%mission%'' THEN ''IMPACT''
        ELSE NULL
      END
      WHERE "classification" IS NOT NULL
    ';

    -- Change the column type to use the enum (only if column exists and is not already the enum type)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'CompanyEmployeeHighlight' 
      AND column_name = 'classification'
      AND data_type != 'USER-DEFINED'
    ) THEN
      EXECUTE '
        ALTER TABLE "CompanyEmployeeHighlight" 
        ALTER COLUMN "classification" TYPE "HighlightClassification" 
        USING "classification"::text::"HighlightClassification"
      ';
    END IF;
  END IF;
END $$;
