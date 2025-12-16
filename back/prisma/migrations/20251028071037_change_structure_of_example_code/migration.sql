/*
  Warnings:

  - The `exampleCode` column on the `MissionExam` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MissionExam" DROP COLUMN "exampleCode",
ADD COLUMN     "exampleCode" JSONB;
