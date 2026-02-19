-- CreateTable
CREATE TABLE "TargetJob" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "rawDescription" TEXT,
    "salaryBand" TEXT,
    "industryOrRole" TEXT,
    "sourceUrl" TEXT,
    "parsedRequirements" JSONB,
    "status" TEXT DEFAULT 'interested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerContact" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "targetJobId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "companyName" TEXT,
    "roleInProcess" TEXT,
    "notes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TargetJob_workMeId_idx" ON "TargetJob"("workMeId");

-- CreateIndex
CREATE INDEX "TargetJob_status_idx" ON "TargetJob"("status");

-- CreateIndex
CREATE INDEX "CareerContact_workMeId_idx" ON "CareerContact"("workMeId");

-- CreateIndex
CREATE INDEX "CareerContact_targetJobId_idx" ON "CareerContact"("targetJobId");

-- AddForeignKey
ALTER TABLE "TargetJob" ADD CONSTRAINT "TargetJob_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerContact" ADD CONSTRAINT "CareerContact_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerContact" ADD CONSTRAINT "CareerContact_targetJobId_fkey" FOREIGN KEY ("targetJobId") REFERENCES "TargetJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
