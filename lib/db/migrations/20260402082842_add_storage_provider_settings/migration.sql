-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppSetting" ADD VALUE 'storageProvider';
ALTER TYPE "AppSetting" ADD VALUE 's3Endpoint';
ALTER TYPE "AppSetting" ADD VALUE 's3Bucket';
ALTER TYPE "AppSetting" ADD VALUE 's3Region';
ALTER TYPE "AppSetting" ADD VALUE 's3AccessKeyId';
ALTER TYPE "AppSetting" ADD VALUE 's3SecretAccessKey';
