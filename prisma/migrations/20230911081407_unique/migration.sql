/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Participant_identifier_key" ON "Participant"("identifier");
