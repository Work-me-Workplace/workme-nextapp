-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "holidaySlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_slug_key" ON "Holiday"("slug");

-- CreateIndex
CREATE INDEX "Holiday_slug_idx" ON "Holiday"("slug");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_holidaySlug_idx" ON "Asset"("holidaySlug");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_holidaySlug_fkey" FOREIGN KEY ("holidaySlug") REFERENCES "Holiday"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

