/*
  Warnings:

  - You are about to drop the column `isPending` on the `Protocol` table. All the data in the column will be lost.
  - You are about to drop the column `isPreview` on the `Protocol` table. All the data in the column will be lost.

*/
-- Delete existing preview protocols before dropping the columns
-- Preview protocols are temporary and should not persist across this migration
DELETE FROM "Protocol" WHERE "isPreview" = true;

-- Clean up orphaned assets (those no longer linked to any Protocol)
DELETE FROM "Asset" a
WHERE NOT EXISTS (
  SELECT 1 FROM "_AssetToProtocol" pa WHERE pa."A" = a."key"
);

-- DropIndex
DROP INDEX "Protocol_isPreview_importedAt_idx";

-- AlterTable
ALTER TABLE "Protocol" DROP COLUMN "isPending",
DROP COLUMN "isPreview";

-- CreateTable
CREATE TABLE "PreviewProtocol" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "description" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "stages" JSONB NOT NULL,
    "codebook" JSONB NOT NULL,
    "experiments" JSONB,
    "isPending" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PreviewProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PreviewProtocolAssets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreviewProtocolAssets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreviewProtocol_hash_key" ON "PreviewProtocol"("hash");

-- CreateIndex
CREATE INDEX "PreviewProtocol_importedAt_idx" ON "PreviewProtocol"("importedAt");

-- CreateIndex
CREATE INDEX "_PreviewProtocolAssets_B_index" ON "_PreviewProtocolAssets"("B");

-- AddForeignKey
ALTER TABLE "_PreviewProtocolAssets" ADD CONSTRAINT "_PreviewProtocolAssets_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreviewProtocolAssets" ADD CONSTRAINT "_PreviewProtocolAssets_B_fkey" FOREIGN KEY ("B") REFERENCES "PreviewProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
