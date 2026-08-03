-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "isSynthetic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "isSynthetic" BOOLEAN NOT NULL DEFAULT false;
