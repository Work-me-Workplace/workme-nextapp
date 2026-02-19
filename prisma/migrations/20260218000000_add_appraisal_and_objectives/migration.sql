-- CreateTable
CREATE TABLE "Appraisal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workMeId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalObjective" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appraisalId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "howMeasured" TEXT,
    "skillTopicIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalObjective_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ContributionSummary" ADD COLUMN "appraisalId" UUID;

-- CreateIndex
CREATE INDEX "Appraisal_workMeId_idx" ON "Appraisal"("workMeId");

-- CreateIndex
CREATE INDEX "Appraisal_periodStart_idx" ON "Appraisal"("periodStart");

-- CreateIndex
CREATE INDEX "Appraisal_periodEnd_idx" ON "Appraisal"("periodEnd");

-- CreateIndex
CREATE INDEX "AppraisalObjective_appraisalId_idx" ON "AppraisalObjective"("appraisalId");

-- CreateIndex
CREATE INDEX "ContributionSummary_appraisalId_idx" ON "ContributionSummary"("appraisalId");

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalObjective" ADD CONSTRAINT "AppraisalObjective_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionSummary" ADD CONSTRAINT "ContributionSummary_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
