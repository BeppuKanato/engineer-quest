ALTER TABLE "User"
ADD COLUMN "selectedMascotId" TEXT NOT NULL DEFAULT 'red-panda',
ADD COLUMN "selectedTargetAchievementId" TEXT;

ALTER TABLE "User"
ADD CONSTRAINT "User_selectedTargetAchievementId_fkey"
FOREIGN KEY ("selectedTargetAchievementId")
REFERENCES "Achievement"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
