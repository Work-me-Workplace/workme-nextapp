-- CreateTable
CREATE TABLE "CompanyUnitHighlight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unitName" TEXT NOT NULL,
    "citationText" TEXT NOT NULL,
    "achievement" TEXT,
    "narrative" TEXT,
    "classification" "HighlightClassification",
    "awardName" TEXT,
    "categoryOfAward" TEXT,
    "awardingAgency" TEXT,
    "awardYear" INTEGER,
    "leaderQuote" TEXT,
    "companyId" TEXT,
    "createdByWorkMeId" UUID NOT NULL,

    CONSTRAINT "CompanyUnitHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyUnitHighlight_createdByWorkMeId_idx" ON "CompanyUnitHighlight"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "CompanyUnitHighlight_companyId_idx" ON "CompanyUnitHighlight"("companyId");

-- CreateIndex
CREATE INDEX "CompanyUnitHighlight_unitName_idx" ON "CompanyUnitHighlight"("unitName");

-- AddForeignKey
ALTER TABLE "CompanyUnitHighlight" ADD CONSTRAINT "CompanyUnitHighlight_createdByWorkMeId_fkey" FOREIGN KEY ("createdByWorkMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUnitHighlight" ADD CONSTRAINT "CompanyUnitHighlight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
