-- 発展ミッションの挑戦記録（スコア・自己ベスト）
CREATE TABLE "DevelopmentMissionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevelopmentMissionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DevelopmentMissionAttempt_userId_missionId_createdAt_idx" ON "DevelopmentMissionAttempt"("userId", "missionId", "createdAt");
CREATE INDEX "DevelopmentMissionAttempt_userId_createdAt_idx" ON "DevelopmentMissionAttempt"("userId", "createdAt");

ALTER TABLE "DevelopmentMissionAttempt" ADD CONSTRAINT "DevelopmentMissionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
