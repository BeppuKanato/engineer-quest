CREATE TABLE "CourseExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseExamHintView" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseExamHintView_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MissionRewardRun" ADD COLUMN "courseExamAttemptId" TEXT;

CREATE INDEX "CourseExamAttempt_userId_missionId_idx" ON "CourseExamAttempt"("userId", "missionId");
CREATE INDEX "CourseExamAttempt_missionId_idx" ON "CourseExamAttempt"("missionId");
CREATE INDEX "CourseExamAttempt_startedAt_idx" ON "CourseExamAttempt"("startedAt");

-- PostgreSQL partial unique index guarantees one unfinished attempt per user/Mission.
CREATE UNIQUE INDEX "CourseExamAttempt_active_key"
ON "CourseExamAttempt"("userId", "missionId")
WHERE "completedAt" IS NULL;

CREATE UNIQUE INDEX "CourseExamHintView_attemptId_hintId_key" ON "CourseExamHintView"("attemptId", "hintId");
CREATE INDEX "CourseExamHintView_attemptId_idx" ON "CourseExamHintView"("attemptId");
CREATE UNIQUE INDEX "MissionRewardRun_courseExamAttemptId_key" ON "MissionRewardRun"("courseExamAttemptId");

ALTER TABLE "CourseExamAttempt" ADD CONSTRAINT "CourseExamAttempt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseExamAttempt" ADD CONSTRAINT "CourseExamAttempt_missionId_fkey"
FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseExamHintView" ADD CONSTRAINT "CourseExamHintView_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "CourseExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MissionRewardRun" ADD CONSTRAINT "MissionRewardRun_courseExamAttemptId_fkey"
FOREIGN KEY ("courseExamAttemptId") REFERENCES "CourseExamAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
