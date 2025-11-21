-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "workMeId",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- AlterTable
ALTER TABLE "CommsOutput" DROP COLUMN "workMeId",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- AlterTable
ALTER TABLE "Objective" DROP COLUMN "workMeId",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- AlterTable
ALTER TABLE "WorkContext" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextBenefits" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCampaign" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCareer" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCommunity" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextEmployeeCause" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextEvent" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextImpactEvent" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextTraining" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkOutput" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkOutputStandalone" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkSupport" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "createdByWorkMeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkforceComms" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- AlterTable
ALTER TABLE "WorkforceCommsDraft" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- AlterTable
ALTER TABLE "WorkforceCommsEdition" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdByWorkMeId" TEXT;

-- CreateIndex
CREATE INDEX "Achievement_companyId_idx" ON "Achievement"("companyId");

-- CreateIndex
CREATE INDEX "Achievement_createdByWorkMeId_idx" ON "Achievement"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "CommsOutput_companyId_idx" ON "CommsOutput"("companyId");

-- CreateIndex
CREATE INDEX "CommsOutput_createdByWorkMeId_idx" ON "CommsOutput"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "Objective_companyId_idx" ON "Objective"("companyId");

-- CreateIndex
CREATE INDEX "Objective_createdByWorkMeId_idx" ON "Objective"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "WorkContext_companyId_idx" ON "WorkContext"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextBenefits_companyId_idx" ON "WorkContextBenefits"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextCampaign_companyId_idx" ON "WorkContextCampaign"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextCareer_companyId_idx" ON "WorkContextCareer"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextCommunity_companyId_idx" ON "WorkContextCommunity"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextEmployeeCause_companyId_idx" ON "WorkContextEmployeeCause"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextEvent_companyId_idx" ON "WorkContextEvent"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextImpactEvent_companyId_idx" ON "WorkContextImpactEvent"("companyId");

-- CreateIndex
CREATE INDEX "WorkContextTraining_companyId_idx" ON "WorkContextTraining"("companyId");

-- CreateIndex
CREATE INDEX "WorkOutput_companyId_idx" ON "WorkOutput"("companyId");

-- CreateIndex
CREATE INDEX "WorkOutputStandalone_companyId_idx" ON "WorkOutputStandalone"("companyId");

-- CreateIndex
CREATE INDEX "WorkSupport_companyId_idx" ON "WorkSupport"("companyId");

-- CreateIndex
CREATE INDEX "WorkforceComms_companyId_idx" ON "WorkforceComms"("companyId");

-- CreateIndex
CREATE INDEX "WorkforceComms_createdByWorkMeId_idx" ON "WorkforceComms"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "WorkforceCommsDraft_companyId_idx" ON "WorkforceCommsDraft"("companyId");

-- CreateIndex
CREATE INDEX "WorkforceCommsDraft_createdByWorkMeId_idx" ON "WorkforceCommsDraft"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "WorkforceCommsEdition_companyId_idx" ON "WorkforceCommsEdition"("companyId");

-- CreateIndex
CREATE INDEX "WorkforceCommsEdition_createdByWorkMeId_idx" ON "WorkforceCommsEdition"("createdByWorkMeId");

-- AddForeignKey
ALTER TABLE "CommsOutput" ADD CONSTRAINT "CommsOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommsOutput" ADD CONSTRAINT "CommsOutput_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContext" ADD CONSTRAINT "WorkContext_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContext" ADD CONSTRAINT "WorkContext_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCampaign" ADD CONSTRAINT "WorkContextCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCampaign" ADD CONSTRAINT "WorkContextCampaign_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextImpactEvent" ADD CONSTRAINT "WorkContextImpactEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextImpactEvent" ADD CONSTRAINT "WorkContextImpactEvent_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextTraining" ADD CONSTRAINT "WorkContextTraining_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextTraining" ADD CONSTRAINT "WorkContextTraining_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextEvent" ADD CONSTRAINT "WorkContextEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextEvent" ADD CONSTRAINT "WorkContextEvent_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCommunity" ADD CONSTRAINT "WorkContextCommunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCommunity" ADD CONSTRAINT "WorkContextCommunity_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextBenefits" ADD CONSTRAINT "WorkContextBenefits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextBenefits" ADD CONSTRAINT "WorkContextBenefits_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCareer" ADD CONSTRAINT "WorkContextCareer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextCareer" ADD CONSTRAINT "WorkContextCareer_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextEmployeeCause" ADD CONSTRAINT "WorkContextEmployeeCause_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkContextEmployeeCause" ADD CONSTRAINT "WorkContextEmployeeCause_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSupport" ADD CONSTRAINT "WorkSupport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSupport" ADD CONSTRAINT "WorkSupport_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOutput" ADD CONSTRAINT "WorkOutput_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOutputStandalone" ADD CONSTRAINT "WorkOutputStandalone_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOutputStandalone" ADD CONSTRAINT "WorkOutputStandalone_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceComms" ADD CONSTRAINT "WorkforceComms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceComms" ADD CONSTRAINT "WorkforceComms_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceCommsDraft" ADD CONSTRAINT "WorkforceCommsDraft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceCommsDraft" ADD CONSTRAINT "WorkforceCommsDraft_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceCommsEdition" ADD CONSTRAINT "WorkforceCommsEdition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceCommsEdition" ADD CONSTRAINT "WorkforceCommsEdition_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

