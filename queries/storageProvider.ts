import { env } from '~/env';
import { prisma } from '~/lib/db';
import { getAppSetting } from '~/queries/appSettings';

export type StorageProvider = 'uploadthing' | 's3';

export async function getStorageProvider(): Promise<StorageProvider> {
  if (env.STORAGE_PROVIDER) return env.STORAGE_PROVIDER;
  const provider = await getAppSetting('storageProvider');
  if (provider === 's3') return 's3';
  return 'uploadthing';
}

export async function hasProtocols(): Promise<boolean> {
  // Counts protocols, not assets: a protocol with no manifest assets still
  // stores its original .netcanvas file (Protocol.originalFileKey) in the
  // configured provider, so changing provider after any import would leave
  // /api/assets/{key} pointing at the wrong storage backend.
  const count = await prisma.protocol.count({ take: 1 });
  return count > 0;
}
