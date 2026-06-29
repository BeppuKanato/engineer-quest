-- AlterTable
ALTER TABLE "User" ADD COLUMN "experience" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserMissionProgress" ADD COLUMN "awardedExp" INTEGER NOT NULL DEFAULT 0;
