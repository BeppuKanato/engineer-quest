/*
  Warnings:

  - Made the column `answer` on table `StepExam` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StepExam" ALTER COLUMN "answer" SET NOT NULL;
