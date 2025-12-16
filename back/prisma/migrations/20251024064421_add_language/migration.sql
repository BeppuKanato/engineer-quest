/*
  Warnings:

  - The `language` column on the `MissionExam` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MissionExamLanguages" AS ENUM ('HTML', 'CSS', 'JavaScript');

-- AlterTable
ALTER TABLE "MissionExam" DROP COLUMN "language",
ADD COLUMN     "language" "MissionExamLanguages"[];
