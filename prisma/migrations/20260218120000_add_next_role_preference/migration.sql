-- CreateTable
CREATE TABLE "NextRolePreference" (
    "id" TEXT NOT NULL,
    "workMeId" UUID NOT NULL,
    "industry" TEXT,
    "companyType" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NextRolePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NextRolePreference_workMeId_key" ON "NextRolePreference"("workMeId");

-- CreateIndex
CREATE INDEX "NextRolePreference_workMeId_idx" ON "NextRolePreference"("workMeId");

-- AddForeignKey
ALTER TABLE "NextRolePreference" ADD CONSTRAINT "NextRolePreference_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
