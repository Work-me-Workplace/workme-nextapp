-- AlterTable: Add windowStart and windowEnd to CompanyCareer
ALTER TABLE "CompanyCareer" ADD COLUMN IF NOT EXISTS "windowStart" TIMESTAMP(3);
ALTER TABLE "CompanyCareer" ADD COLUMN IF NOT EXISTS "windowEnd" TIMESTAMP(3);
