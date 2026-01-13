-- CreateTable
CREATE TABLE "SharedMissionExamProgress" (
    "id" TEXT NOT NULL,
    "examProgressId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedMissionExamProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedMissionExamProgress_examProgressId_key" ON "SharedMissionExamProgress"("examProgressId");

-- AddForeignKey
ALTER TABLE "SharedMissionExamProgress" ADD CONSTRAINT "SharedMissionExamProgress_examProgressId_fkey" FOREIGN KEY ("examProgressId") REFERENCES "MissionExamProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMissionExamProgress" ADD CONSTRAINT "SharedMissionExamProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
