-- AlterTable: Add completionDeadline and isSelfPaced fields to CompanyTraining
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "completionDeadline" TIMESTAMP(3);
ALTER TABLE "CompanyTraining" ADD COLUMN IF NOT EXISTS "isSelfPaced" BOOLEAN NOT NULL DEFAULT false;
