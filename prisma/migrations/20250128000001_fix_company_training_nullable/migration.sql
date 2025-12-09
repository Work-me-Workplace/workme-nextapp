-- Fix CompanyTraining nullable constraints to match Prisma schema (only if table exists)
-- All fields should be nullable except id, createdAt, companyId, and mandatory (has default)

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CompanyTraining') THEN
        ALTER TABLE "CompanyTraining" ALTER COLUMN "title" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "description" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "topic" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "sponsoringOffice" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "trainingDate" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "startTime" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "endTime" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "location" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "format" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "link" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "pocFirstName" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "pocLastName" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "pocEmail" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "pocPhone" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "pocRankOrTitle" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "ingestRawText" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "ingestType" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "ingestStatus" DROP NOT NULL;
        ALTER TABLE "CompanyTraining" ALTER COLUMN "ingestCreatedAt" DROP NOT NULL;
    END IF;
END $$;
