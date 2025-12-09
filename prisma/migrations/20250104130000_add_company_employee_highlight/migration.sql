-- CreateTable
CREATE TABLE "CompanyEmployeeHighlight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "unit" TEXT,
    "awardName" TEXT,
    "awardingAgency" TEXT,
    "awardYear" INTEGER,
    "citationText" TEXT NOT NULL,
    "achievement" TEXT,
    "narrative" TEXT,
    "classification" TEXT,
    "photoUrl" TEXT,
    "supervisorQuote" TEXT,
    "companyUnit" TEXT,
    "createdByWorkMeId" UUID NOT NULL,

    CONSTRAINT "CompanyEmployeeHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyEmployeeHighlight_companyUnit_idx" ON "CompanyEmployeeHighlight"("companyUnit");

-- CreateIndex
CREATE INDEX "CompanyEmployeeHighlight_createdByWorkMeId_idx" ON "CompanyEmployeeHighlight"("createdByWorkMeId");

-- AddForeignKey
ALTER TABLE "CompanyEmployeeHighlight" ADD CONSTRAINT "CompanyEmployeeHighlight_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

