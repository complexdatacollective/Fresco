-- AlterEnum
ALTER TYPE "AppSetting" ADD VALUE 'previewModeRequireAuth';

-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN "isPreview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Protocol" ADD COLUMN "uploadCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");

-- CreateIndex
CREATE INDEX "Protocol_isPreview_importedAt_idx" ON "Protocol"("isPreview", "importedAt");
