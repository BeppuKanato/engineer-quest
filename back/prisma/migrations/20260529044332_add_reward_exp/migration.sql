-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "rewardExp" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "MissionExam" ALTER COLUMN "rewardExp" SET DEFAULT 100;
