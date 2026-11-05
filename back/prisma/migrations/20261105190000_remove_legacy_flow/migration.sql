-- Remove the legacy Mission/Activity learning flow (Issue #103).
-- The Course model itself is kept: courses become the new-flow units.
-- KnowledgeCardScheduleEntry is dropped together with its mission reference;
-- the phase-based schedule is reintroduced by the app integration work.

-- DropForeignKey / DropColumn on keeper tables
ALTER TABLE "Achievement" DROP COLUMN "missionId";
ALTER TABLE "QuestPost" DROP COLUMN "missionId";

-- DropTable (children first)
DROP TABLE "ActivityAnswerLog";
DROP TABLE "UserMissionActivityProgress";
DROP TABLE "UserMissionProgress";
DROP TABLE "MissionActivity";
DROP TABLE "KnowledgeCardScheduleEntry";
DROP TABLE "MissionRewardRun";
DROP TABLE "CourseExamHintView";
DROP TABLE "CourseExamTestExecution";
DROP TABLE "CourseExamSubmission";
DROP TABLE "CourseExamFeedback";
DROP TABLE "CourseExamAttempt";
DROP TABLE "Mission";

-- DropEnum
DROP TYPE "MissionType";
DROP TYPE "MissionActivityType";
DROP TYPE "ProgressStatus";
