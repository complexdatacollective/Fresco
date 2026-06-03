-- AlterTable
ALTER TABLE "Protocol" DROP COLUMN "originalFileKey",
DROP COLUMN "originalFileUrl",
ADD COLUMN "originalFileParts" JSONB;
