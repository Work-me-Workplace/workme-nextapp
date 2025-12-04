-- Migration: Add WorkProfile, CompanyUnit, and WorkEntry tables
-- This migration adds the new identity and work affiliation models

-- Create WorkProfile table (personal identity)
CREATE TABLE "WorkProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "headline" TEXT,
  "currentRole" TEXT,
  "handle" TEXT NOT NULL UNIQUE,
  "linkedinUrl" TEXT,
  "profileImage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create CompanyUnit table (registry)
CREATE TABLE "CompanyUnit" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "domain" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create WorkEntry table (work history junction)
CREATE TABLE "WorkEntry" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "companyUnitId" TEXT NOT NULL,
  "division" TEXT,
  "title" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE "WorkProfile" 
  ADD CONSTRAINT "WorkProfile_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "WorkMe"("id") 
  ON DELETE CASCADE;

ALTER TABLE "WorkEntry" 
  ADD CONSTRAINT "WorkEntry_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "WorkMe"("id") 
  ON DELETE CASCADE;

ALTER TABLE "WorkEntry" 
  ADD CONSTRAINT "WorkEntry_companyUnitId_fkey" 
  FOREIGN KEY ("companyUnitId") REFERENCES "CompanyUnit"("id") 
  ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "WorkProfile_userId_idx" ON "WorkProfile"("userId");
CREATE INDEX "WorkProfile_handle_idx" ON "WorkProfile"("handle");
CREATE INDEX "CompanyUnit_name_idx" ON "CompanyUnit"("name");
CREATE INDEX "CompanyUnit_domain_idx" ON "CompanyUnit"("domain");
CREATE INDEX "WorkEntry_userId_idx" ON "WorkEntry"("userId");
CREATE INDEX "WorkEntry_companyUnitId_idx" ON "WorkEntry"("companyUnitId");
CREATE INDEX "WorkEntry_startDate_idx" ON "WorkEntry"("startDate");
CREATE INDEX "WorkEntry_endDate_idx" ON "WorkEntry"("endDate");
