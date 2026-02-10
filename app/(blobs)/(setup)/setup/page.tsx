import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import {
  getAppSetting,
  requireAppNotConfigured,
  requireAppNotExpired,
} from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/lib/db';
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

  return {
    hasAuth: !!session,
    allowAnonymousRecruitment,
    limitInterviews,
    hasProtocol: otherData[0] > 0,
    hasParticipants: otherData[1] > 0,
    hasUploadThingToken: !!uploadThingToken,
  };
}

export type SetupData = Awaited<ReturnType<typeof getSetupData>>;

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAppNotExpired(true);
  await requireAppNotConfigured();

  const setupData = await getSetupData();

  return (
    <Suspense
      fallback={<Loader2 className="text-background h-10 w-10 animate-spin" />}
    >
      <Setup setupData={setupData} />
    </Suspense>
  );
}
