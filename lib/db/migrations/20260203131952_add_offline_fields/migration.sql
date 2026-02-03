-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN "availableOffline" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
