-- CreateEnum
CREATE TYPE "ProductFamilyStatus" AS ENUM ('CONCEPT', 'ADVOCATED', 'PROGRAM');

-- CreateEnum
CREATE TYPE "EvidenceClassificationType" AS ENUM ('COMPANY_PRODUCTS', 'COMPANY_PUBLIC_PERCEPTION', 'EXTERNAL_COMPANY_PRESSURE');

-- CreateTable
CREATE TABLE "ProductFamily" (
    "id" TEXT NOT NULL,
    "companyId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductFamilyStatus" NOT NULL DEFAULT 'CONCEPT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalEvidence" (
    "id" TEXT NOT NULL,
    "productFamilyId" TEXT NOT NULL,
    "productPlatformId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "snippet" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceClassification" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "classificationType" "EvidenceClassificationType" NOT NULL,
    "confirmedByUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductFamily_companyId_idx" ON "ProductFamily"("companyId");

-- CreateIndex
CREATE INDEX "ProductFamily_name_idx" ON "ProductFamily"("name");

-- CreateIndex
CREATE INDEX "ProductFamily_status_idx" ON "ProductFamily"("status");

-- CreateIndex
CREATE INDEX "ExternalEvidence_productFamilyId_idx" ON "ExternalEvidence"("productFamilyId");

-- CreateIndex
CREATE INDEX "ExternalEvidence_productPlatformId_idx" ON "ExternalEvidence"("productPlatformId");

-- CreateIndex
CREATE INDEX "ExternalEvidence_url_idx" ON "ExternalEvidence"("url");

-- CreateIndex
CREATE INDEX "ExternalEvidence_capturedAt_idx" ON "ExternalEvidence"("capturedAt");

-- CreateIndex
CREATE INDEX "EvidenceClassification_evidenceId_idx" ON "EvidenceClassification"("evidenceId");

-- CreateIndex
CREATE INDEX "EvidenceClassification_classificationType_idx" ON "EvidenceClassification"("classificationType");

-- CreateIndex
CREATE INDEX "EvidenceClassification_confirmedByUser_idx" ON "EvidenceClassification"("confirmedByUser");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceClassification_evidenceId_classificationType_key" ON "EvidenceClassification"("evidenceId", "classificationType");

-- AddForeignKey
ALTER TABLE "ProductFamily" ADD CONSTRAINT "ProductFamily_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEvidence" ADD CONSTRAINT "ExternalEvidence_productFamilyId_fkey" FOREIGN KEY ("productFamilyId") REFERENCES "ProductFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEvidence" ADD CONSTRAINT "ExternalEvidence_productPlatformId_fkey" FOREIGN KEY ("productPlatformId") REFERENCES "CompanyPlatformProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceClassification" ADD CONSTRAINT "EvidenceClassification_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "ExternalEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;