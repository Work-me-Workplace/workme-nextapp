-- Migration: Add MySkills table
-- Standalone intelligence module attached directly to WorkMe

-- Create MySkills table
CREATE TABLE "MySkills" (
  "id" TEXT PRIMARY KEY,
  "workMeId" UUID NOT NULL UNIQUE,
  "mySkillsRaw" TEXT,
  "myJobResponsibilitiesRaw" TEXT,
  "myStrengthsRaw" TEXT,
  "mySkillsAI" TEXT,
  "myJobResponsibilitiesAI" TEXT,
  "myStrengthsAI" TEXT,
  "insightSnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE "MySkills" 
  ADD CONSTRAINT "MySkills_workMeId_fkey" 
  FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") 
  ON DELETE CASCADE;

-- Create index
CREATE INDEX "MySkills_workMeId_idx" ON "MySkills"("workMeId");
