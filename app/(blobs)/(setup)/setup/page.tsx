import React, { Suspense } from 'react';
import Setup from './Setup';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';
import {
  requireAppNotExpired,
  getAnonymousRecruitmentStatus,
  getLimitInterviewsStatus,
} from '~/queries/appSettings';

async function getSetupData() {
  const { session } = await getServerSession();
  const allowAnonymousRecruitment = await getAnonymousRecruitmentStatus();
  const limitInterviews = await getLimitInterviewsStatus();
  const otherData = await prisma.$transaction([
    prisma.protocol.count(),
    prisma.participant.count(),
  ]);

  return {
    hasAuth: !!session,
    allowAnonymousRecruitment,
    limitInterviews,
    hasProtocol: otherData[0] > 0,
    hasParticipants: otherData[1] > 0,
  };
}

export type SetupData = ReturnType<typeof getSetupData>;

export default async function Page() {
  await requireAppNotExpired(true);

  const setupDataPromise = getSetupData();

  return (
    <Suspense fallback="Loading...">
      <Setup setupDataPromise={setupDataPromise} />
    </Suspense>
  );
}