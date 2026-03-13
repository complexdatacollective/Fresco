-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "value" TEXT;

-- AlterTable
ALTER TABLE "_AssetToProtocol" ADD CONSTRAINT "_AssetToProtocol_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AssetToProtocol_AB_unique";
