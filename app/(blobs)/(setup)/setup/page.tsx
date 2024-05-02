import React, { Suspense } from 'react';
import Setup from './Setup';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { requireAppNotExpired } from '~/queries/appSettings';

async function getSteupData() {
  const { session } = await getServerSession();
  const otherData = await prisma.$transaction([
    prisma.protocol.count(),
    prisma.participant.count(),
  ]);

  return {
    hasAuth: !!session,
    hasProtocol: otherData[0] > 0,
    hasParticipants: otherData[1] > 0,
  };
}

export type SetupData = ReturnType<typeof getSteupData>;

export default async function Page() {
  await requireAppNotExpired(true);

  const setupDataPromise = getSteupData();

  return (
    <Suspense fallback="Loading...">
      <Setup setupDataPromise={setupDataPromise} />
    </Suspense>
  );
}