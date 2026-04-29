/* eslint-disable no-console */
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { migrateProtocol } from '@codaco/protocol-validation';
import { hash } from 'ohash';
import { UTApi } from 'uploadthing/server';
import { Prisma, type PrismaClient } from '~/lib/db/generated/client';
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

async function migrateOneProtocol(
  prisma: PrismaClient,
  row: {
    id: string;
    name: string;
    schemaVersion: number;
    stages: unknown;
    codebook: unknown;
    experiments: unknown;
    description: string | null;
  },
): Promise<void> {
  const cleanName = row.name.replace(/\.netcanvas$/i, '');

  const reconstructed = {
    name: cleanName,
    schemaVersion: row.schemaVersion,
    stages: row.stages,
    codebook: row.codebook,
    description: row.description ?? undefined,
  };

  const migrated = migrateProtocol(reconstructed, 8, { name: cleanName });
  const newHash = hash(migrated);

  await prisma.protocol.update({
    where: { id: row.id },
    data: {
      schemaVersion: 8,
      stages: migrated.stages,
      codebook: migrated.codebook,
      experiments: migrated.experiments ?? Prisma.JsonNull,
      hash: newHash,
    },
  });

  console.log(
    `Migrated "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
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

  const v7Protocols = await prisma.protocol.findMany({
    where: { schemaVersion: { lt: 8 } },
    select: {
      id: true,
      name: true,
      schemaVersion: true,
      stages: true,
      codebook: true,
      experiments: true,
      description: true,
    },
  });

  if (v7Protocols.length === 0) {
    console.log('No protocols at schemaVersion < 8 to migrate.');
    return;
  }

  console.log(
    `Found ${v7Protocols.length} protocols at schemaVersion < 8. Migrating to v8...`,
  );

  for (const row of v7Protocols) {
    await migrateOneProtocol(prisma, row);
  }

  console.log(`Migrated ${v7Protocols.length} protocols.`);
}
