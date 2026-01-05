-- CreateTable
CREATE TABLE "SignalArtifact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "saidBy" TEXT,
    "role" TEXT,
    "source" TEXT,
    "createdByWorkMeId" UUID,

    CONSTRAINT "SignalArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeniorLeaderTopic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signalArtifactId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SeniorLeaderTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalArtifact_createdByWorkMeId_idx" ON "SignalArtifact"("createdByWorkMeId");

-- CreateIndex
CREATE INDEX "SignalArtifact_source_idx" ON "SignalArtifact"("source");

-- CreateIndex
CREATE INDEX "SignalArtifact_createdAt_idx" ON "SignalArtifact"("createdAt");

-- CreateIndex
CREATE INDEX "SeniorLeaderTopic_signalArtifactId_idx" ON "SeniorLeaderTopic"("signalArtifactId");

-- CreateIndex
CREATE INDEX "SeniorLeaderTopic_createdAt_idx" ON "SeniorLeaderTopic"("createdAt");

-- AddForeignKey
ALTER TABLE "SeniorLeaderTopic" ADD CONSTRAINT "SeniorLeaderTopic_signalArtifactId_fkey" FOREIGN KEY ("signalArtifactId") REFERENCES "SignalArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;






