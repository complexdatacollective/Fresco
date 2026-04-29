-- Consolidate preview protocols back into the Protocol table. Replaces the
-- short-lived separate PreviewProtocol table with isPreview / isPending
-- columns on Protocol.
--
-- Idempotent so it works in three environments:
--   1. Fresh DB: columns and index already added by earlier migrations
--      (20251118073416 added isPreview, 20251204222357 added isPending).
--      The ADD COLUMN / CREATE INDEX statements are no-ops; the DROP TABLE
--      statements are no-ops.
--   2. Dev DB that ran the now-deleted PreviewProtocol-creation migration:
--      Columns and index need restoring; PreviewProtocol tables need
--      dropping. This migration does both.
--   3. Production / CI fresh deploy after this branch ships: same as (1).

ALTER TABLE "Protocol"
  ADD COLUMN IF NOT EXISTS "isPreview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isPending" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Protocol_isPreview_importedAt_idx"
  ON "Protocol"("isPreview", "importedAt");

DROP TABLE IF EXISTS "_PreviewProtocolAssets";
DROP TABLE IF EXISTS "PreviewProtocol";
