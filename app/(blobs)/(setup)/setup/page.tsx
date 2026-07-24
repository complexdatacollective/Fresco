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
import { type S3EnvValues } from '~/schemas/s3Settings';
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

  const storageEnv = getStorageEnvStatus();

  const s3EnvValues: S3EnvValues | null = storageEnv.s3EnvManaged
    ? {
        s3Endpoint: env.S3_ENDPOINT ?? '',
        s3PublicUrl: env.S3_PUBLIC_URL ?? '',
        s3Bucket: env.S3_BUCKET ?? '',
        s3Region: env.S3_REGION ?? '',
        s3AccessKeyId: env.S3_ACCESS_KEY_ID ?? '',
        s3SecretAccessKey: env.S3_SECRET_ACCESS_KEY ? '••••••••' : '',
      }
    : null;

  return {
    hasAuth: !!session,
    allowAnonymousRecruitment,
    limitInterviews,
    hasProtocol: otherData[0] > 0,
    hasParticipants: otherData[1] > 0,
    storageEnv,
    s3EnvValues,
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
