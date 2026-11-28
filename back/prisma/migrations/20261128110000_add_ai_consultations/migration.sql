-- AI 相談（ステージ1）の相談ログ
CREATE TABLE "AiConsultation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "phaseKey" TEXT,
    "userMessage" TEXT NOT NULL,
    "assistantMessage" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConsultation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiConsultation_userId_courseId_createdAt_idx" ON "AiConsultation"("userId", "courseId", "createdAt");
CREATE INDEX "AiConsultation_userId_createdAt_idx" ON "AiConsultation"("userId", "createdAt");

ALTER TABLE "AiConsultation" ADD CONSTRAINT "AiConsultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
