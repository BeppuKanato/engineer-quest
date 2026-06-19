-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('MAIN', 'CHALLENGE');

-- AlterTable
ALTER TABLE "Mission"
ADD COLUMN     "type" "MissionType" NOT NULL DEFAULT 'MAIN',
ADD COLUMN     "isRequiredForCourseCompletion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentMissionId" TEXT,
ADD COLUMN     "roadmapLane" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "branchOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Mission_courseId_type_idx" ON "Mission"("courseId", "type");

-- CreateIndex
CREATE INDEX "Mission_parentMissionId_idx" ON "Mission"("parentMissionId");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_parentMissionId_fkey" FOREIGN KEY ("parentMissionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
