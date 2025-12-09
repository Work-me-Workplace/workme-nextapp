-- CreateEnum
CREATE TYPE "DigitalSignType" AS ENUM ('WORKFORCE', 'COMPANY_NEWS', 'WORKFORCE_ACHIEVEMENT', 'COMPANY_EVENT');

-- CreateTable
CREATE TABLE "ProductDigitalSign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signType" "DigitalSignType" NOT NULL,
    "companyUnit" TEXT,
    "createdByWorkMeId" UUID NOT NULL,

    CONSTRAINT "ProductDigitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDigitalSignWorkforce" (
    "id" TEXT NOT NULL,
    "signageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "icon" TEXT,
    "background" TEXT,
    "footerNote" TEXT,

    CONSTRAINT "ProductDigitalSignWorkforce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDigitalSignCompanyNews" (
    "id" TEXT NOT NULL,
    "signageId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "body" TEXT,
    "link" TEXT,
    "thumbnail" TEXT,

    CONSTRAINT "ProductDigitalSignCompanyNews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDigitalSignWorkforceAchievement" (
    "id" TEXT NOT NULL,
    "signageId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "unit" TEXT,
    "achievement" TEXT NOT NULL,
    "details" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "ProductDigitalSignWorkforceAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDigitalSignCompanyEvent" (
    "id" TEXT NOT NULL,
    "signageId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "description" TEXT,
    "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "registrationLink" TEXT,

    CONSTRAINT "ProductDigitalSignCompanyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDigitalSign_companyUnit_idx" ON "ProductDigitalSign"("companyUnit");

-- CreateIndex
CREATE INDEX "ProductDigitalSign_createdByWorkMeId_idx" ON "ProductDigitalSign"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "ProductDigitalSign_signType_idx" ON "ProductDigitalSign"("signType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDigitalSignWorkforce_signageId_key" ON "ProductDigitalSignWorkforce"("signageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDigitalSignCompanyNews_signageId_key" ON "ProductDigitalSignCompanyNews"("signageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDigitalSignWorkforceAchievement_signageId_key" ON "ProductDigitalSignWorkforceAchievement"("signageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDigitalSignCompanyEvent_signageId_key" ON "ProductDigitalSignCompanyEvent"("signageId");

-- AddForeignKey
ALTER TABLE "ProductDigitalSign" ADD CONSTRAINT "ProductDigitalSign_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDigitalSignWorkforce" ADD CONSTRAINT "ProductDigitalSignWorkforce_signageId_fkey" FOREIGN KEY ("signageId") REFERENCES "ProductDigitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDigitalSignCompanyNews" ADD CONSTRAINT "ProductDigitalSignCompanyNews_signageId_fkey" FOREIGN KEY ("signageId") REFERENCES "ProductDigitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDigitalSignWorkforceAchievement" ADD CONSTRAINT "ProductDigitalSignWorkforceAchievement_signageId_fkey" FOREIGN KEY ("signageId") REFERENCES "ProductDigitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDigitalSignCompanyEvent" ADD CONSTRAINT "ProductDigitalSignCompanyEvent_signageId_fkey" FOREIGN KEY ("signageId") REFERENCES "ProductDigitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

