import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { protocol } from '~/lib/test-protocol';
import { prisma } from '~/utils/db';

export const getInterviews = createCachedFunction(async () => {
  const interviews = await prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
  return interviews;
}, ['getInterviews']);

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;

export const getInterviewsForExport = createCachedFunction(
  async (interviewIds: string[]) => {
    const interviews = await prisma.interview.findMany({
      where: {
        id: {
          in: interviewIds,
        },
      },
      include: {
        protocol: true,
        participant: true,
      },
    });
    return interviews;
  },
  ['getInterviewsForExport', 'getInterviews'],
);

export const getInterviewById = (interviewId: string) =>
  createCachedFunction(
    async (interviewId: string) => {
      const interview = await prisma.interview.findUnique({
        where: {
          id: interviewId,
        },
        include: {
          protocol: {
            include: {
              assets: true,
            },
          },
        },
      });

      return interview;
    },
    [`getInterviewById-${interviewId}`, 'getInterviewById'],
  )(interviewId);

export const TESTING_getInterviewById = async (interviewId: string) => {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ TESTING_getInterviewById is being used! Remove before release. ⚠️',
  );
  const interview = await prisma.interview.findUnique({
    where: {
      id: interviewId,
    },
    include: {
      protocol: {
        include: {
          assets: true,
        },
      },
    },
  });

  if (!interview) {
    return null;
  }

  // Override protocol with a test protocol
  interview.protocol.stages = protocol.stages;
  interview.protocol.codebook = protocol.codebook;

  // add any api keys from asset manifest to the protocol assets
  const apiKeyAssets = Object.entries(protocol.assetManifest ?? {})
    .filter(([, asset]) => asset.type === 'apikey')
    .map(([, asset]) => {
      if (asset.type === 'apikey') {
        return {
          key: asset.id,
          assetId: asset.id,
          type: asset.type,
          name: asset.name,
          value: asset.value,
          size: 0,
          url: '',
        };
      }
      return null;
    })
    .filter((asset) => asset !== null);

  interview.protocol.assets.push(...apiKeyAssets);

  return interview;
};
