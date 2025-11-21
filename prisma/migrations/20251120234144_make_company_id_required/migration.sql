-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CommsOutput" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Objective" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContext" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextBenefits" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCampaign" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCareer" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextCommunity" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextEmployeeCause" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextEvent" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextImpactEvent" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkContextTraining" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkOutput" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkOutputStandalone" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkSupport" ALTER COLUMN "createdByWorkMeId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkforceComms" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkforceCommsDraft" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkforceCommsEdition" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "createdByWorkMeId" SET NOT NULL;

