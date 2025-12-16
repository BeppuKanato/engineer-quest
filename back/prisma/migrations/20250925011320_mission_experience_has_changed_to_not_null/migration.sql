/*
  Warnings:

  - Made the column `experience` on table `Mission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Mission" ALTER COLUMN "experience" SET NOT NULL;
