/*
  Warnings:

  - You are about to drop the column `code` on the `MissionExamProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MissionExamProgress" DROP COLUMN "code";

-- CreateTable
CREATE TABLE "MissionExamUserCode" (
    "id" TEXT NOT NULL,
    "examProgressId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" "MissionExamLanguages" NOT NULL,
    "fileName" TEXT,

    CONSTRAINT "MissionExamUserCode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MissionExamUserCode" ADD CONSTRAINT "MissionExamUserCode_examProgressId_fkey" FOREIGN KEY ("examProgressId") REFERENCES "MissionExamProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
