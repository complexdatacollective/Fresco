-- AlterEnum
ALTER TYPE "AppSetting" ADD VALUE 'disableSmallScreenOverlay';

-- AlterTable
ALTER TABLE "_AssetToProtocol" ADD CONSTRAINT "_AssetToProtocol_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AssetToProtocol_AB_unique";
