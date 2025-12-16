-- DropForeignKey
ALTER TABLE "AchievementCondition" DROP CONSTRAINT "AchievementCondition_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "Explain" DROP CONSTRAINT "Explain_stepId_fkey";

-- DropForeignKey
ALTER TABLE "MissionAfterSentence" DROP CONSTRAINT "MissionAfterSentence_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionBeforeSentence" DROP CONSTRAINT "MissionBeforeSentence_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExam" DROP CONSTRAINT "MissionExam_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamProgress" DROP CONSTRAINT "MissionExamProgress_examId_fkey";

-- DropForeignKey
ALTER TABLE "MissionProgress" DROP CONSTRAINT "MissionProgress_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByAchievement" DROP CONSTRAINT "MissionUnlockByAchievement_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByAchievement" DROP CONSTRAINT "MissionUnlockByAchievement_requiredId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByLevel" DROP CONSTRAINT "MissionUnlockByLevel_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByMission" DROP CONSTRAINT "MissionUnlockByMission_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByMission" DROP CONSTRAINT "MissionUnlockByMission_requiredId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByRank" DROP CONSTRAINT "MissionUnlockByRank_missionId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_missionId_fkey";

-- DropForeignKey
ALTER TABLE "StepExam" DROP CONSTRAINT "StepExam_stepId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explain" ADD CONSTRAINT "Explain_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExam" ADD CONSTRAINT "MissionExam_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepExam" ADD CONSTRAINT "StepExam_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamProgress" ADD CONSTRAINT "MissionExamProgress_examId_fkey" FOREIGN KEY ("examId") REFERENCES "MissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByRank" ADD CONSTRAINT "MissionUnlockByRank_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByLevel" ADD CONSTRAINT "MissionUnlockByLevel_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionBeforeSentence" ADD CONSTRAINT "MissionBeforeSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAfterSentence" ADD CONSTRAINT "MissionAfterSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementCondition" ADD CONSTRAINT "AchievementCondition_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
