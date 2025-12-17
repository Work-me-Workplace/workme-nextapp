-- CreateEnum
CREATE TYPE "DigestStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT');

-- CreateEnum
CREATE TYPE "DigestEntryType" AS ENUM ('DELIVERY', 'WIN', 'WORKFORCE', 'REMINDER');

-- CreateEnum
CREATE TYPE "DigestSourceType" AS ENUM ('COMPANY_UNIT', 'PLATFORM_UNIT', 'EVENT', 'MILESTONE', 'WORKFORCE', 'MANUAL');

-- CreateTable
CREATE TABLE "SeniorLeaderDigest" (
    "id" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "leaderRole" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "subjectLine" TEXT,
    "openingNote" TEXT,
    "status" "DigestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeniorLeaderDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeniorLeaderDigestEntry" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "type" "DigestEntryType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" "DigestSourceType",
    "sourceId" TEXT,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "SeniorLeaderDigestEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeniorLeaderDigest_organizationId_idx" ON "SeniorLeaderDigest"("organizationId");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigest_weekOf_idx" ON "SeniorLeaderDigest"("weekOf");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigest_status_idx" ON "SeniorLeaderDigest"("status");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigest_createdAt_idx" ON "SeniorLeaderDigest"("createdAt");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigestEntry_digestId_idx" ON "SeniorLeaderDigestEntry"("digestId");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigestEntry_type_idx" ON "SeniorLeaderDigestEntry"("type");

-- CreateIndex
CREATE INDEX "SeniorLeaderDigestEntry_orderIndex_idx" ON "SeniorLeaderDigestEntry"("orderIndex");

-- AddForeignKey
ALTER TABLE "SeniorLeaderDigestEntry" ADD CONSTRAINT "SeniorLeaderDigestEntry_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "SeniorLeaderDigest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
