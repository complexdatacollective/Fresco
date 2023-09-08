/*
  Warnings:

  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoleToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `userId` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Protocol` table. All the data in the column will be lost.
  - Added the required column `participantId` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Role_name_key";

-- DropIndex
DROP INDEX "_RoleToUser_B_index";

-- DropIndex
DROP INDEX "_RoleToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Role";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_RoleToUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashed_password" TEXT,
    "user_id" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishTime" DATETIME,
    "exportTime" DATETIME,
    "lastUpdated" DATETIME NOT NULL,
    "network" TEXT NOT NULL DEFAULT '',
    "participantId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Interview" ("currentStep", "exportTime", "finishTime", "id", "lastUpdated", "network", "protocolId", "startTime") SELECT "currentStep", "exportTime", "finishTime", "id", "lastUpdated", "network", "protocolId", "startTime" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
CREATE UNIQUE INDEX "Interview_participantId_key" ON "Interview"("participantId");
CREATE INDEX "Interview_protocolId_idx" ON "Interview"("protocolId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL
);
INSERT INTO "new_User" ("id") SELECT "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Protocol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "description" TEXT,
    "assetPath" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" DATETIME NOT NULL,
    "stages" TEXT NOT NULL,
    "codebook" TEXT NOT NULL
);
INSERT INTO "new_Protocol" ("assetPath", "codebook", "description", "hash", "id", "importedAt", "lastModified", "name", "schemaVersion", "stages") SELECT "assetPath", "codebook", "description", "hash", "id", "importedAt", "lastModified", "name", "schemaVersion", "stages" FROM "Protocol";
DROP TABLE "Protocol";
ALTER TABLE "new_Protocol" RENAME TO "Protocol";
CREATE UNIQUE INDEX "Protocol_hash_key" ON "Protocol"("hash");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Key_id_key" ON "Key"("id");

-- CreateIndex
CREATE INDEX "Key_user_id_idx" ON "Key"("user_id");
