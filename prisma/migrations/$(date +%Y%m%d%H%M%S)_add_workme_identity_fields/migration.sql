-- Migration: Add identity fields to WorkMe table
-- Adds headline, handle, title, linkedinUrl to WorkMe model

-- Add headline column (optional)
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "headline" TEXT;

-- Add handle column (optional, unique)
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "handle" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "WorkMe_handle_key" ON "WorkMe"("handle") WHERE "handle" IS NOT NULL;

-- Add title column (optional)
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- Add linkedinUrl column (optional)
ALTER TABLE "WorkMe" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;

-- Create index on handle for faster lookups
CREATE INDEX IF NOT EXISTS "WorkMe_handle_idx" ON "WorkMe"("handle") WHERE "handle" IS NOT NULL;

