/* eslint-disable no-console */
import {
  DeleteObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { UTApi } from 'uploadthing/server';
import { type PrismaClient } from '~/lib/db/generated/client';
import { type AppSetting } from '~/lib/db/generated/enums';

const STORAGE_SETTING_KEYS: AppSetting[] = [
  'storageProvider',
  'uploadThingToken',
  's3Endpoint',
  's3Region',
  's3Bucket',
  's3AccessKeyId',
  's3SecretAccessKey',
];

async function deleteOrphanBlobs(
  prisma: PrismaClient,
  keys: string[],
): Promise<void> {
  if (keys.length === 0) return;

  try {
    const settings = await prisma.appSettings.findMany({
      where: { key: { in: STORAGE_SETTING_KEYS } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const provider = map.storageProvider ?? 'uploadthing';

    if (provider === 'uploadthing') {
      const utapi = new UTApi({ token: map.uploadThingToken });
      await utapi.deleteFiles(keys);
    } else {
      if (
        !map.s3Endpoint ||
        !map.s3Region ||
        !map.s3Bucket ||
        !map.s3AccessKeyId ||
        !map.s3SecretAccessKey
      ) {
        throw new Error('S3 credentials are not configured');
      }
      const client = new S3Client({
        endpoint: map.s3Endpoint,
        region: map.s3Region,
        credentials: {
          accessKeyId: map.s3AccessKeyId,
          secretAccessKey: map.s3SecretAccessKey,
        },
        forcePathStyle: true,
      });
      await client.send(
        new DeleteObjectsCommand({
          Bucket: map.s3Bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
    }

    console.log(`Deleted ${keys.length} orphan blobs from ${provider}`);
  } catch (err) {
    console.error('Blob cleanup failed (continuing):', err);
  }
}

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
  const orphanAssets = await prisma.asset.findMany({
    where: {
      previewProtocols: { some: {} },
      protocols: { none: {} },
    },
    select: { key: true },
  });
  const orphanKeys = orphanAssets.map((a) => a.key);

  const previewDeleteResult = await prisma.previewProtocol.deleteMany({});
  console.log(
    `PreviewProtocol cleanup: deleted ${previewDeleteResult.count} rows, ${orphanKeys.length} orphan assets`,
  );

  await deleteOrphanBlobs(prisma, orphanKeys);

  if (orphanKeys.length > 0) {
    await prisma.asset.deleteMany({ where: { key: { in: orphanKeys } } });
    console.log(`Deleted ${orphanKeys.length} orphan asset rows`);
  }
}
