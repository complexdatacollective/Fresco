-- CreateEnum
CREATE TYPE "AppSetting" AS ENUM ('configured', 'allowAnonymousRecruitment', 'limitInterviews', 'initializedAt', 'installationId',  'disableAnalytics',  'uploadThingToken');

-- Temporary table to hold the data
CREATE TEMPORARY TABLE _OldAppSettings AS SELECT * FROM "AppSettings";

-- Drop existing table
DROP TABLE "AppSettings";

-- Create new table structure
CREATE TABLE "AppSettings" (
	"key" "AppSetting" NOT NULL,
	"value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- Migrate data from old table
INSERT INTO "AppSettings" ("key", "value")
SELECT 'configured', CAST("configured" AS TEXT) FROM _OldAppSettings LIMIT 1;

INSERT INTO "AppSettings" ("key", "value")
SELECT 'allowAnonymousRecruitment', CAST("allowAnonymousRecruitment" AS TEXT) FROM _OldAppSettings LIMIT 1;

INSERT INTO "AppSettings" ("key", "value")
SELECT 'limitInterviews', CAST("limitInterviews" AS TEXT) FROM _OldAppSettings LIMIT 1;

INSERT INTO "AppSettings" ("key", "value")
SELECT 'initializedAt', CAST("initializedAt" AS TEXT) FROM _OldAppSettings LIMIT 1;

INSERT INTO "AppSettings" ("key", "value")
SELECT 'installationId', "installationId" FROM _OldAppSettings LIMIT 1;

-- Drop the temporary table
DROP TABLE _OldAppSettings;
