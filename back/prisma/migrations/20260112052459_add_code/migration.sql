/*
  Warnings:

  - Added the required column `code` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MissionExamProgress" ADD COLUMN     "code" TEXT NOT NULL;
