import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { env } from '~/env';
import { getServerSession } from '~/lib/auth/guards';
import { prisma } from '~/lib/db';
import { getStorageEnvStatus } from '~/lib/storage/config';
import {
  getAppSetting,
  requireAppNotConfigured,
  requireAppNotExpired,
} from '~/queries/appSettings';
import Setup from './Setup';

async function getSetupData() {
  const session = await getServerSession();
  const allowAnonymousRecruitment = await getAppSetting(
    'allowAnonymousRecruitment',
  );
  const limitInterviews = await getAppSetting('limitInterviews');
  const otherData = await Promise.all([
    prisma.protocol.count(),
    prisma.participant.count(),
  ]);

  const uploadThingToken = await getAppSetting('uploadThingToken');

  const { s3EnvManaged, uploadThingEnvManaged } = getStorageEnvStatus();

  return {
    hasAuth: !!session,
    allowAnonymousRecruitment,
    limitInterviews,
    hasProtocol: otherData[0] > 0,
    hasParticipants: otherData[1] > 0,
    hasUploadThingToken: !!uploadThingToken,
    storageEnv: {
      pinnedProvider: env.STORAGE_PROVIDER ?? null,
      s3EnvManaged,
      uploadThingEnvManaged,
    },
  };
}

export type SetupData = Awaited<ReturnType<typeof getSetupData>>;

export default function Page() {
  return (
    <Suspense
      fallback={<Loader2 className="text-background size-10 animate-spin" />}
    >
      <SetupContent />
    </Suspense>
  );
}

async function SetupContent() {
  await requireAppNotExpired(true);
  await requireAppNotConfigured();
  const setupData = await getSetupData();
  return <Setup setupData={setupData} />;
}
