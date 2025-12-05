-- Add companyId column to CompanyUnit if it doesn't exist
ALTER TABLE "CompanyUnit" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUnit_companyId_fkey'
  ) THEN
    ALTER TABLE "CompanyUnit" ADD CONSTRAINT "CompanyUnit_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "CompanyRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS "CompanyUnit_companyId_idx" ON "CompanyUnit"("companyId");

