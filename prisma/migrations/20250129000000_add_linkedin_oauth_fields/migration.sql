-- AlterTable
ALTER TABLE "WorkMe" ADD COLUMN "linkedinUserId" TEXT,
ADD COLUMN "linkedinAccessToken" TEXT,
ADD COLUMN "linkedinTokenExpiresAt" TIMESTAMPTZ;

