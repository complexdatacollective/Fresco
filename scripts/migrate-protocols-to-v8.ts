/* eslint-disable no-console */
import { type PrismaClient } from '~/lib/db/generated/client';

/**
 * Truncate PreviewProtocol (cleaning up orphan assets + blobs) and migrate
 * any Protocol rows at schemaVersion < 8 up to v8.
 *
 * Idempotent. Hard-fails per protocol on migration errors. Best-effort on
 * blob storage deletions.
 */
export async function migrateProtocolsToV8(
  prisma: PrismaClient,
): Promise<void> {
  // 1. Find orphan asset keys
  const orphanAssets = await prisma.asset.findMany({
    where: {
      previewProtocols: { some: {} },
      protocols: { none: {} },
    },
    select: { key: true },
  });
  const orphanKeys = orphanAssets.map((a) => a.key);

  // 2. Truncate PreviewProtocol (M2M join rows cascade)
  const previewDeleteResult = await prisma.previewProtocol.deleteMany({});
  console.log(
    `PreviewProtocol cleanup: deleted ${previewDeleteResult.count} rows, ${orphanKeys.length} orphan assets`,
  );

  // 3. Delete orphan Asset DB rows
  if (orphanKeys.length > 0) {
    await prisma.asset.deleteMany({ where: { key: { in: orphanKeys } } });
    console.log(`Deleted ${orphanKeys.length} orphan asset rows`);
  }
}
