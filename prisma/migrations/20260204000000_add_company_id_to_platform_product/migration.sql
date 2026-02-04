-- Add companyId as nullable (will be populated and made required in a follow-up migration)
ALTER TABLE "CompanyPlatformProduct" ADD COLUMN "companyId" TEXT;

-- Add foreign key constraint (nullable for now)
ALTER TABLE "CompanyPlatformProduct" ADD CONSTRAINT "CompanyPlatformProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index
CREATE INDEX "CompanyPlatformProduct_companyId_idx" ON "CompanyPlatformProduct"("companyId");
