-- Migration: Add productivity models (MyWorkOutlook, MyWorkItem, AdminWorkItem)

-- Create MyWorkOutlook table
CREATE TABLE "MyWorkOutlook" (
  "id" TEXT PRIMARY KEY,
  "workMeId" UUID NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create MyWorkItem table
CREATE TABLE "MyWorkItem" (
  "id" TEXT PRIMARY KEY,
  "outlookId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "dueDate" TIMESTAMP(3),
  "tag" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create AdminWorkItem table
CREATE TABLE "AdminWorkItem" (
  "id" TEXT PRIMARY KEY,
  "workMeId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE "MyWorkOutlook" 
  ADD CONSTRAINT "MyWorkOutlook_workMeId_fkey" 
  FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") 
  ON DELETE CASCADE;

ALTER TABLE "MyWorkItem" 
  ADD CONSTRAINT "MyWorkItem_outlookId_fkey" 
  FOREIGN KEY ("outlookId") REFERENCES "MyWorkOutlook"("id") 
  ON DELETE CASCADE;

ALTER TABLE "AdminWorkItem" 
  ADD CONSTRAINT "AdminWorkItem_workMeId_fkey" 
  FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") 
  ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "MyWorkOutlook_workMeId_idx" ON "MyWorkOutlook"("workMeId");
CREATE INDEX "MyWorkItem_outlookId_idx" ON "MyWorkItem"("outlookId");
CREATE INDEX "MyWorkItem_status_idx" ON "MyWorkItem"("status");
CREATE INDEX "AdminWorkItem_workMeId_idx" ON "AdminWorkItem"("workMeId");
CREATE INDEX "AdminWorkItem_status_idx" ON "AdminWorkItem"("status");
