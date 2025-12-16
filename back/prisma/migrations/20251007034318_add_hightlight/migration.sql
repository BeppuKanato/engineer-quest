/*
  Warnings:

  - Added the required column `highlight` to the `Explain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Explain" ADD COLUMN     "highlight" TEXT NOT NULL;
