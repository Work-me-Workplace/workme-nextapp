-- Remove originatorId column from CompanyTraining (ghost column - removed from Prisma schema)
-- This column was removed during the WorkContext → CompanyX refactor

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CompanyTraining') THEN
        ALTER TABLE "CompanyTraining" DROP COLUMN IF EXISTS "originatorId";
    END IF;
END $$;
