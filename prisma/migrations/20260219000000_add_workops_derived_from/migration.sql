-- CreateEnum
CREATE TYPE "WorkOpsDerivedFrom" AS ENUM ('my_own', 'boss', 'workforce_comms', 'external_pressure', 'personal');

-- AlterTable
ALTER TABLE "WorkOpsItem" ADD COLUMN "derivedFrom" "WorkOpsDerivedFrom";
