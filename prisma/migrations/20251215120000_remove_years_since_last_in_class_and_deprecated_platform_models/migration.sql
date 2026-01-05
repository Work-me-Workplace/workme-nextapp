-- Remove yearsSinceLastInClass column from CompanyPlatformProduct
-- This field is redundant since we now have classStartDate
ALTER TABLE "CompanyPlatformProduct" DROP COLUMN IF EXISTS "yearsSinceLastInClass";

-- Drop deprecated Platform-related tables
-- These models have been replaced by CompanyPlatformProduct

-- Drop foreign key constraints first
ALTER TABLE "PlatformCapability" DROP CONSTRAINT IF EXISTS "PlatformCapability_platformId_fkey";
ALTER TABLE "PlatformCommNode" DROP CONSTRAINT IF EXISTS "PlatformCommNode_platformId_fkey";
ALTER TABLE "PlatformContract" DROP CONSTRAINT IF EXISTS "PlatformContract_platformId_fkey";
ALTER TABLE "PlatformContract" DROP CONSTRAINT IF EXISTS "PlatformContract_companyId_fkey";
ALTER TABLE "PlatformSignal" DROP CONSTRAINT IF EXISTS "PlatformSignal_platformId_fkey";

-- Drop the many-to-many relation table
DROP TABLE IF EXISTS "_EcosystemCompanyPlatforms";

-- Drop the Platform-related tables
DROP TABLE IF EXISTS "PlatformSignal";
DROP TABLE IF EXISTS "PlatformContract";
DROP TABLE IF EXISTS "PlatformCommNode";
DROP TABLE IF EXISTS "PlatformCapability";
DROP TABLE IF EXISTS "Platform";






