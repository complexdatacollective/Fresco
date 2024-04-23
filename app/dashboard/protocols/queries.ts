import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

export async function getProtocols() {
  unstable_noStore();

  const protocols = await prisma.protocol.findMany({
    include: { interviews: true },
  });

  return protocols;
}

export async function getAllowAnonymousRecruitment() {
  unstable_noStore();

  const appSettings = await prisma.appSettings.findFirst({
    select: {
      allowAnonymousRecruitment: true,
    },
  });

  return !!appSettings?.allowAnonymousRecruitment;
}
