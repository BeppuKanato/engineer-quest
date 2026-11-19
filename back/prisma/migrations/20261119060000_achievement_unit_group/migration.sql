ALTER TYPE "AchievementConditionType" ADD VALUE 'UNIT_GROUP_COMPLETE';

ALTER TABLE "Achievement"
ADD COLUMN "conditionUnitIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "conditionGroupName" TEXT;
