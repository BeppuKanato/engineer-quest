ALTER TYPE "MissionType" ADD VALUE 'COURSE_EXAM';

ALTER TABLE "UserMissionProgress"
  ADD COLUMN "selectedExamDifficulty" "CourseDifficulty",
  ADD COLUMN "highestClearedExamDifficulty" "CourseDifficulty",
  ADD COLUMN "examAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "examHintCount" INTEGER NOT NULL DEFAULT 0;
