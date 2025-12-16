-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('REPRODUCTION', 'FREE_CREATION');

-- AlterEnum
ALTER TYPE "MissionType" ADD VALUE 'PROMOTION';

-- AlterTable
ALTER TABLE "MissionExam" ADD COLUMN     "instructions" TEXT[],
ADD COLUMN     "type" "ExamType";
