-- Add workMeId for authorship tracking
ALTER TABLE "CompanyPlatformProduct" ADD COLUMN "workMeId" UUID;

-- Add foreign key constraint
ALTER TABLE "CompanyPlatformProduct" ADD CONSTRAINT "CompanyPlatformProduct_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index
CREATE INDEX "CompanyPlatformProduct_workMeId_idx" ON "CompanyPlatformProduct"("workMeId");
