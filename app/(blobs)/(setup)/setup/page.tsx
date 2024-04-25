import React, { Suspense } from 'react';
import Setup from './Setup';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

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

export type DataPromiseType = ReturnType<typeof getSteupData>;

export default function Page() {
  const dataPromise = getSteupData();
  return (
    <Suspense>
      <Setup dataPromise={dataPromise} />
    </Suspense>
  );
}
