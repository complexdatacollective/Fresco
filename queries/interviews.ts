import { unstable_noStore } from 'next/cache';
import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { protocol } from '~/lib/test-protocol';
import { prisma } from '~/utils/db';
import { withoutDates } from '~/utils/withoutDates';

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
        protocol: {
          include: {
            assets: true,
          },
        },
        participant: true,
      },
    });

    const stringifiedInterviews = withoutDates(interviews);

    return stringifiedInterviews;
  },
  ['getInterviewsForExport', 'getInterviews'],
);

export const getInterviewById = async (interviewId: string) => {
  // unstable_noStore();
  // const interview = await prisma.interview.findUnique({
  //   where: {
  //     id: interviewId,
  //   },
  //   include: {
  //     protocol: {
  //       include: {
  //         assets: true,
  //       },
  //     },
  //   },
  // });

  // if (!interview) {
  //   return null;
  // }

  // const stringifiedInterview = withoutDates(interview);

  // return {
  //   ...stringifiedInterview,
  //   protocol: {
  //     ...stringifiedInterview.protocol,
  //     stages: protocol.stages,
  //     codebook: protocol.codebook,
  //   },
  //   stageMetadata:
  //     stringifiedInterview.stageMetadata ?? ({} as Record<string, unknown>),
  // };

  unstable_noStore();
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

  const stringifiedInterview = withoutDates(interview);

  // Override protocol with a test protocol
  stringifiedInterview.protocol.stages = protocol.stages;
  stringifiedInterview.protocol.codebook = protocol.codebook;

  return stringifiedInterview;
};

export type GetInterviewByIdReturnType = Awaited<
  ReturnType<typeof getInterviewById>
>;
