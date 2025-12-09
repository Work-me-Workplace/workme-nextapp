-- AlterTable: Add firebaseId to WorkMe (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkMe') THEN
        ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "firebaseId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "WorkMe_firebaseId_key" ON "WorkMe"("firebaseId");
    END IF;
END $$;

-- CreateTable: WorkMeCompany
CREATE TABLE IF NOT EXISTS "workme_company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workme_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SuperAdmin (REMOVED - was accidentally added, belongs in IgniteBd-Next-combine)
-- SuperAdmin table creation removed - this was meant for Ignite, not WorkMe

-- AlterTable: Add workMeCompanyId to WorkMe (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkMe') THEN
        ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "workMeCompanyId" TEXT;
    END IF;
END $$;

-- AlterTable: Update Company to use workMeCompanyId instead of containerId (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Company') THEN
        ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "workMeCompanyId" TEXT;
    END IF;
END $$;

-- AddForeignKey: WorkMe to WorkMeCompany (only if WorkMe table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkMe') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'WorkMe_workMeCompanyId_fkey'
        ) THEN
            ALTER TABLE "WorkMe" ADD CONSTRAINT "WorkMe_workMeCompanyId_fkey" 
            FOREIGN KEY ("workMeCompanyId") REFERENCES "workme_company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: SuperAdmin to WorkMe (REMOVED - SuperAdmin was removed from WorkMe)

-- AddForeignKey: Company to WorkMeCompany (only if Company table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Company') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'Company_workMeCompanyId_fkey'
        ) THEN
            ALTER TABLE "Company" ADD CONSTRAINT "Company_workMeCompanyId_fkey" 
            FOREIGN KEY ("workMeCompanyId") REFERENCES "workme_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- CreateIndex: Company unique constraint (only if Company table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Company') THEN
        DROP INDEX IF EXISTS "Company_containerId_name_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "Company_workMeCompanyId_name_key" ON "Company"("workMeCompanyId", "name");
        CREATE INDEX IF NOT EXISTS "Company_workMeCompanyId_idx" ON "Company"("workMeCompanyId");
    END IF;
END $$;

