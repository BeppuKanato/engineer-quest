/*
  Warnings:

  - Added the required column `star` to the `Mission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JudgeType" ADD VALUE 'PHILANTHROPIST';
ALTER TYPE "JudgeType" ADD VALUE 'ACHIEVER';
ALTER TYPE "JudgeType" ADD VALUE 'FREE_SPIRIT';
ALTER TYPE "JudgeType" ADD VALUE 'SOCIALIZER';
ALTER TYPE "JudgeType" ADD VALUE 'PLAYER';
ALTER TYPE "JudgeType" ADD VALUE 'DISRUPTOR';

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "star" INTEGER NOT NULL,
ALTER COLUMN "experience" SET DEFAULT 1;
