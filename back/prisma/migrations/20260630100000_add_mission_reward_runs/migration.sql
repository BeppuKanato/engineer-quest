-- CreateTable
CREATE TABLE "MissionRewardRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "candidateKnowledgeCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectedKnowledgeCardId" TEXT,
    "knowledgeCardSelectedAt" TIMESTAMP(3),
    "unlockedAchievementIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "awardedExp" INTEGER NOT NULL DEFAULT 0,
    "awardedBadgeTickets" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionRewardRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionRewardRun_userId_idx" ON "MissionRewardRun"("userId");

-- CreateIndex
CREATE INDEX "MissionRewardRun_missionId_idx" ON "MissionRewardRun"("missionId");

-- CreateIndex
CREATE INDEX "MissionRewardRun_createdAt_idx" ON "MissionRewardRun"("createdAt");

-- AddForeignKey
ALTER TABLE "MissionRewardRun" ADD CONSTRAINT "MissionRewardRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRewardRun" ADD CONSTRAINT "MissionRewardRun_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
