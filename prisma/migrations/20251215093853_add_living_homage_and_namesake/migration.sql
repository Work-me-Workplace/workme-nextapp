-- CreateTable
CREATE TABLE "Namesake" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "knownAs" TEXT,
    "role" TEXT,
    "whyKnown" TEXT,
    "legacySummary" TEXT,
    "era" TEXT,
    "honors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "Namesake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivingHomage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "relation" TEXT,
    "namesakeId" TEXT,
    "notes" TEXT,

    CONSTRAINT "LivingHomage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CompanyMilestone" ADD COLUMN "livingHomageId" TEXT,
ADD COLUMN "namesakeId" TEXT;

-- CreateIndex
CREATE INDEX "Namesake_fullName_idx" ON "Namesake"("fullName");

-- CreateIndex
CREATE INDEX "LivingHomage_fullName_idx" ON "LivingHomage"("fullName");

-- CreateIndex
CREATE INDEX "LivingHomage_namesakeId_idx" ON "LivingHomage"("namesakeId");

-- CreateIndex
CREATE INDEX "CompanyMilestone_livingHomageId_idx" ON "CompanyMilestone"("livingHomageId");

-- CreateIndex
CREATE INDEX "CompanyMilestone_namesakeId_idx" ON "CompanyMilestone"("namesakeId");

-- AddForeignKey
ALTER TABLE "LivingHomage" ADD CONSTRAINT "LivingHomage_namesakeId_fkey" FOREIGN KEY ("namesakeId") REFERENCES "Namesake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMilestone" ADD CONSTRAINT "CompanyMilestone_livingHomageId_fkey" FOREIGN KEY ("livingHomageId") REFERENCES "LivingHomage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMilestone" ADD CONSTRAINT "CompanyMilestone_namesakeId_fkey" FOREIGN KEY ("namesakeId") REFERENCES "Namesake"("id") ON DELETE SET NULL ON UPDATE CASCADE;



