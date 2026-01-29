-- CreateTable
CREATE TABLE "CompanyProductSharepoint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "siteUrl" TEXT,
    "siteType" TEXT,
    "owner" TEXT,
    "accessLevel" TEXT,
    "lastSyncDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CompanyProductSharepoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyProductSharepoint_name_idx" ON "CompanyProductSharepoint"("name");

-- CreateIndex
CREATE INDEX "CompanyProductSharepoint_siteType_idx" ON "CompanyProductSharepoint"("siteType");

-- CreateIndex
CREATE INDEX "CompanyProductSharepoint_owner_idx" ON "CompanyProductSharepoint"("owner");
