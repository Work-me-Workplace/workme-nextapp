-- CreateEnum
CREATE TYPE "WorkOpsItemType" AS ENUM ('task', 'capture', 'meeting', 'signal', 'fire', 'boss_request', 'tech_work', 'admin', 'workforce_comms', 'external_pressure', 'personal');

-- CreateEnum
CREATE TYPE "WorkOpsUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "WorkOpsStatus" AS ENUM ('open', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "WorkOpsSource" AS ENUM ('manual', 'ai', 'boss', 'system');

-- DropForeignKey (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'MyWorkItem') THEN
        ALTER TABLE "MyWorkItem" DROP CONSTRAINT IF EXISTS "MyWorkItem_outlookId_fkey";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'MyWorkOutlook') THEN
        ALTER TABLE "MyWorkOutlook" DROP CONSTRAINT IF EXISTS "MyWorkOutlook_workMeId_fkey";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'AdminWorkItem') THEN
        ALTER TABLE "AdminWorkItem" DROP CONSTRAINT IF EXISTS "AdminWorkItem_workMeId_fkey";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkOutlookItem') THEN
        ALTER TABLE "WorkOutlookItem" DROP CONSTRAINT IF EXISTS "WorkOutlookItem_workMeId_fkey";
    END IF;
END $$;

-- DropTable (only if tables exist)
DROP TABLE IF EXISTS "MyWorkItem";
DROP TABLE IF EXISTS "MyWorkOutlook";
DROP TABLE IF EXISTS "AdminWorkItem";
DROP TABLE IF EXISTS "WorkOutlookItem";

-- CreateTable
CREATE TABLE "WorkOpsOutlook" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOpsOutlook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOpsItem" (
    "id" TEXT NOT NULL,
    "outlookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "itemType" "WorkOpsItemType" NOT NULL,
    "urgency" "WorkOpsUrgency",
    "status" "WorkOpsStatus" NOT NULL DEFAULT 'open',
    "source" "WorkOpsSource",
    "priority" INTEGER,
    "dueDate" TIMESTAMP(3),
    "assignedBy" TEXT,

    CONSTRAINT "WorkOpsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOpsDailyAssignment" (
    "id" TEXT NOT NULL,
    "outlookId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "dayIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOpsDailyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOpsOutlook_workMeId_key" ON "WorkOpsOutlook"("workMeId");

-- CreateIndex
CREATE INDEX "WorkOpsOutlook_workMeId_idx" ON "WorkOpsOutlook"("workMeId");

-- CreateIndex
CREATE INDEX "WorkOpsItem_outlookId_idx" ON "WorkOpsItem"("outlookId");

-- CreateIndex
CREATE INDEX "WorkOpsItem_status_idx" ON "WorkOpsItem"("status");

-- CreateIndex
CREATE INDEX "WorkOpsItem_itemType_idx" ON "WorkOpsItem"("itemType");

-- CreateIndex
CREATE INDEX "WorkOpsDailyAssignment_outlookId_idx" ON "WorkOpsDailyAssignment"("outlookId");

-- CreateIndex
CREATE INDEX "WorkOpsDailyAssignment_itemId_idx" ON "WorkOpsDailyAssignment"("itemId");

-- CreateIndex
CREATE INDEX "WorkOpsDailyAssignment_day_idx" ON "WorkOpsDailyAssignment"("day");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOpsDailyAssignment_itemId_day_key" ON "WorkOpsDailyAssignment"("itemId", "day");

-- AddForeignKey
ALTER TABLE "WorkOpsOutlook" ADD CONSTRAINT "WorkOpsOutlook_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOpsItem" ADD CONSTRAINT "WorkOpsItem_outlookId_fkey" FOREIGN KEY ("outlookId") REFERENCES "WorkOpsOutlook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOpsDailyAssignment" ADD CONSTRAINT "WorkOpsDailyAssignment_outlookId_fkey" FOREIGN KEY ("outlookId") REFERENCES "WorkOpsOutlook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOpsDailyAssignment" ADD CONSTRAINT "WorkOpsDailyAssignment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "WorkOpsItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

