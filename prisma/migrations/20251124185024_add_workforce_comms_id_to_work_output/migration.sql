-- AlterTable: Add workforceCommsId foreign key to WorkOutput
ALTER TABLE "WorkOutput" ADD COLUMN IF NOT EXISTS "workforceCommsId" TEXT;

-- CreateIndex: Add index on workforceCommsId for query performance
CREATE INDEX IF NOT EXISTS "WorkOutput_workforceCommsId_idx" ON "WorkOutput"("workforceCommsId");

-- AddForeignKey: Create foreign key constraint linking WorkOutput to WorkforceComms
ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_workforceCommsId_fkey" 
  FOREIGN KEY ("workforceCommsId") 
  REFERENCES "WorkforceComms"("workforceCommsId") 
  ON DELETE SET NULL ON UPDATE CASCADE;

