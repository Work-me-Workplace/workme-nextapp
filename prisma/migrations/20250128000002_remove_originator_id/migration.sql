-- Remove originatorId column from CompanyTraining (ghost column - removed from Prisma schema)
-- This column was removed during the WorkContext → CompanyX refactor

ALTER TABLE "CompanyTraining" DROP COLUMN IF EXISTS "originatorId";
