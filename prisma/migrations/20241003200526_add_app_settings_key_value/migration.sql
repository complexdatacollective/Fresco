/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `AppSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "key" TEXT,
ADD COLUMN     "value" TEXT;

