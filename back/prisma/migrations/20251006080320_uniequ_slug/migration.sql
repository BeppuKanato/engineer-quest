/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Character` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Difficulty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Mission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Rank` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Achievement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Character` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Difficulty` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Mission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Rank` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Difficulty" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Mission" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Rank" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_slug_key" ON "Difficulty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_slug_key" ON "Mission"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_slug_key" ON "Rank"("slug");
