-- AlterTable: Add firebaseId to WorkMe
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "firebaseId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "WorkMe_firebaseId_key" ON "WorkMe"("firebaseId");

-- CreateTable: WorkMeCompany
CREATE TABLE IF NOT EXISTS "workme_company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workme_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SuperAdmin
CREATE TABLE IF NOT EXISTS "super_admin" (
    "id" TEXT NOT NULL,
    "firebaseId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "workMeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SuperAdmin unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "super_admin_firebaseId_key" ON "super_admin"("firebaseId");
CREATE UNIQUE INDEX IF NOT EXISTS "super_admin_email_key" ON "super_admin"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "super_admin_workMeId_key" ON "super_admin"("workMeId");

-- AlterTable: Add workMeCompanyId to WorkMe
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "workMeCompanyId" TEXT;

-- AlterTable: Update Company to use workMeCompanyId instead of containerId
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "workMeCompanyId" TEXT;

-- AddForeignKey: WorkMe to WorkMeCompany
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'WorkMe_workMeCompanyId_fkey'
    ) THEN
        ALTER TABLE "WorkMe" ADD CONSTRAINT "WorkMe_workMeCompanyId_fkey" 
        FOREIGN KEY ("workMeCompanyId") REFERENCES "workme_company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: SuperAdmin to WorkMe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'super_admin_workMeId_fkey'
    ) THEN
        ALTER TABLE "super_admin" ADD CONSTRAINT "super_admin_workMeId_fkey" 
        FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Company to WorkMeCompany
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Company_workMeCompanyId_fkey'
    ) THEN
        ALTER TABLE "Company" ADD CONSTRAINT "Company_workMeCompanyId_fkey" 
        FOREIGN KEY ("workMeCompanyId") REFERENCES "workme_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex: Company unique constraint
DROP INDEX IF EXISTS "Company_containerId_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Company_workMeCompanyId_name_key" ON "Company"("workMeCompanyId", "name");

-- CreateIndex: Company workMeCompanyId index
CREATE INDEX IF NOT EXISTS "Company_workMeCompanyId_idx" ON "Company"("workMeCompanyId");

