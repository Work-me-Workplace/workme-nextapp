-- Create the enum type
CREATE TYPE "HighlightClassification" AS ENUM ('EXCELLENCE', 'LEADERSHIP', 'INNOVATION', 'SERVICE', 'IMPACT');

-- Convert existing string values to enum values before changing column type
UPDATE "CompanyEmployeeHighlight"
SET "classification" = CASE
  WHEN LOWER("classification") LIKE '%excellence%' OR LOWER("classification") LIKE '%achievement%' OR LOWER("classification") LIKE '%award%' THEN 'EXCELLENCE'
  WHEN LOWER("classification") LIKE '%leadership%' OR LOWER("classification") LIKE '%promotion%' THEN 'LEADERSHIP'
  WHEN LOWER("classification") LIKE '%innovation%' OR LOWER("classification") LIKE '%patent%' OR LOWER("classification") LIKE '%breakthrough%' THEN 'INNOVATION'
  WHEN LOWER("classification") LIKE '%service%' OR LOWER("classification") LIKE '%volunteer%' THEN 'SERVICE'
  WHEN LOWER("classification") LIKE '%impact%' OR LOWER("classification") LIKE '%mission%' THEN 'IMPACT'
  ELSE NULL
END
WHERE "classification" IS NOT NULL;

-- Change the column type to use the enum
ALTER TABLE "CompanyEmployeeHighlight" 
ALTER COLUMN "classification" TYPE "HighlightClassification" 
USING "classification"::text::"HighlightClassification";
