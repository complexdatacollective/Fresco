import { prisma } from '~/lib/db';
import { getAppSetting } from '~/queries/appSettings';

export type StorageProvider = 'uploadthing' | 's3';

export async function getStorageProvider(): Promise<StorageProvider> {
  const provider = await getAppSetting('storageProvider');
  if (provider === 's3') return 's3';
  return 'uploadthing';
}

export async function hasProtocols(): Promise<boolean> {
  const count = await prisma.asset.count({ take: 1 });
  return count > 0;
}
