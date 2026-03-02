-- CreateEnum
CREATE TYPE "WorkOpsCategory" AS ENUM ('product', 'planning', 'bossrequest', 'emergent', 'companyevent');

-- AlterTable
ALTER TABLE "WorkOpsItem" ADD COLUMN "category" "WorkOpsCategory";

-- CreateIndex
CREATE INDEX "WorkOpsItem_category_idx" ON "WorkOpsItem"("category");
