-- Rename Appraisal -> PerformancePlan (no appraisal; universal: performance plan = what was planned, performance review = what I did)
ALTER TABLE "Appraisal" RENAME TO "PerformancePlan";

-- Add period type and performance review summary (what I did)
ALTER TABLE "PerformancePlan" ADD COLUMN IF NOT EXISTS "periodType" TEXT;
ALTER TABLE "PerformancePlan" ADD COLUMN IF NOT EXISTS "performanceReviewSummary" TEXT;

-- ContributionSummary: rename appraisalId -> performancePlanId
ALTER TABLE "ContributionSummary" DROP CONSTRAINT IF EXISTS "ContributionSummary_appraisalId_fkey";
ALTER TABLE "ContributionSummary" RENAME COLUMN "appraisalId" TO "performancePlanId";
ALTER TABLE "ContributionSummary" ADD CONSTRAINT "ContributionSummary_performancePlanId_fkey" FOREIGN KEY ("performancePlanId") REFERENCES "PerformancePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename AppraisalObjective -> PerformancePlanObjective and add howIllContribute
ALTER TABLE "AppraisalObjective" DROP CONSTRAINT IF EXISTS "AppraisalObjective_appraisalId_fkey";
ALTER TABLE "AppraisalObjective" RENAME COLUMN "appraisalId" TO "performancePlanId";
ALTER TABLE "AppraisalObjective" ADD COLUMN IF NOT EXISTS "howIllContribute" TEXT;
ALTER TABLE "AppraisalObjective" RENAME TO "PerformancePlanObjective";
ALTER TABLE "PerformancePlanObjective" ADD CONSTRAINT "PerformancePlanObjective_performancePlanId_fkey" FOREIGN KEY ("performancePlanId") REFERENCES "PerformancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate indexes for new table/column names
DROP INDEX IF EXISTS "Appraisal_workMeId_idx";
DROP INDEX IF EXISTS "Appraisal_periodStart_idx";
DROP INDEX IF EXISTS "Appraisal_periodEnd_idx";
CREATE INDEX "PerformancePlan_workMeId_idx" ON "PerformancePlan"("workMeId");
CREATE INDEX "PerformancePlan_periodStart_idx" ON "PerformancePlan"("periodStart");
CREATE INDEX "PerformancePlan_periodEnd_idx" ON "PerformancePlan"("periodEnd");
CREATE INDEX "PerformancePlan_periodType_idx" ON "PerformancePlan"("periodType");

DROP INDEX IF EXISTS "AppraisalObjective_appraisalId_idx";
CREATE INDEX "PerformancePlanObjective_performancePlanId_idx" ON "PerformancePlanObjective"("performancePlanId");

DROP INDEX IF EXISTS "ContributionSummary_appraisalId_idx";
CREATE INDEX "ContributionSummary_performancePlanId_idx" ON "ContributionSummary"("performancePlanId");
