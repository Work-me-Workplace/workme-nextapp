-- AlterTable: Add workforceCommsId foreign key to WorkOutput (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutput') THEN
        ALTER TABLE "WorkOutput" ADD COLUMN IF NOT EXISTS "workforceCommsId" TEXT;

        -- CreateIndex: Add index on workforceCommsId for query performance
        CREATE INDEX IF NOT EXISTS "WorkOutput_workforceCommsId_idx" ON "WorkOutput"("workforceCommsId");

        -- AddForeignKey: Create foreign key constraint linking WorkOutput to WorkforceComms
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOutput_workforceCommsId_fkey') THEN
            ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_workforceCommsId_fkey" 
              FOREIGN KEY ("workforceCommsId") 
              REFERENCES "WorkforceComms"("workforceCommsId") 
              ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

