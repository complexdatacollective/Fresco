import 'server-only';
import { stringify } from 'superjson';
import { prisma } from '~/utils/db';

/**
 * Define the Prisma query logic for fetching all interviews separately
 * to infer the type from the return value.
 */
async function prisma_getInterviews() {
  return prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
}
export type GetInterviewsQuery = Awaited<
  ReturnType<typeof prisma_getInterviews>
>;

/*export const getInterviews = createCachedFunction(async () => {
  const interviews = await prisma_getInterviews();
  const safeInterviews = stringify(interviews);
  return safeInterviews;
}, ['getInterviews']);*/
export const getInterviews = async () => {
  const interviews = await prisma_getInterviews();
  const safeInterviews = stringify(interviews);
  return safeInterviews;
};

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;
async function prisma_getInterviewsForExport(interviewIds: string[]) {
  return prisma.interview.findMany({
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
}
export type GetInterviewsForExportQuery = Awaited<
  ReturnType<typeof prisma_getInterviewsForExport>
>;

export const getInterviewsForExport = async (interviewIds: string[]) => {
  const interviews = await prisma_getInterviewsForExport(interviewIds);
  const safeInterviews = stringify(interviews);
  return safeInterviews;
};

/**
 * Because we use a client extension to parse the JSON fields, we can't use the
 * automatically generated types from the Prisma client (Prisma.InterviewGetPayload).
 *
 * Instead, we have to infer the type from the return value. To do this, we
 * have to define the function outside of getInterviewById.
 */
async function prisma_getInterviewById(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      protocol: {
        include: { assets: true },
        omit: {
          lastModified: true,
          hash: true,
        },
      },
    },
  });
}
export type GetInterviewByIdQuery = Awaited<
  ReturnType<typeof prisma_getInterviewById>
>;

// Note that this function should not be cached, because invalidating the cache
// would cause the interview route to reload, thereby clearing the redux store.
export const getInterviewById = async (interviewId: string) => {
  const interview = await prisma_getInterviewById(interviewId);

  if (!interview) {
    return null;
  }

  // We need to superjsonify the result, because we pass it to the client
  // and it contains a Date object. We should look into if this could be
  // implemented in the Prisma client instead, or the createCachedFunction
  // helper (could be generalised to `createServerFunction`).
  const safeInterview = stringify(interview);

  // return safeInterview;
  return JSON.stringify({
    json: {
      id: 'cme0esbwe0002p5ez7x3u1v3g',
      startTime: '2025-08-06T20:16:39.231Z',
      finishTime: null,
      exportTime: null,
      lastUpdated: '2025-08-06T20:16:39.231Z',
      network: {
        nodes: [],
        edges: [],
        ego: { _uid: '37b7cb82-6eff-4041-b153-ae6caa0682ee', attributes: {} },
      },
      participantId: 'cme0esbwe0003p5ezwm541nma',
      protocolId: 'cme0erq4d0000p5ezi593j7gn',
      currentStep: 0,
      stageMetadata: null,
      protocol: {
        id: 'cme0erq4d0000p5ezi593j7gn',
        name: 'Protocol.netcanvas',
        schemaVersion: 7,
        description: null,
        importedAt: '2025-08-06T20:16:11.005Z',
        stages: [
          {
            id: 'e312ff80-7301-11f0-af9e-5d5fda83c493',
            label: 'Example2',
            type: 'FamilyTreeCensus',
            form: {
              title: 'Add personal info',
              fields: [
                {
                  variable: 'bd054697-95f5-40de-8d40-d752b451d516',
                  prompt: 'What is this person&#39;s name?\n',
                },
              ],
            },
            subject: {
              entity: 'node',
              type: '54532334-bfb9-4f54-9672-07931dd396a3',
            },
            prompts: [
              {
                id: 'd057c3a5-ec09-497f-8db5-9b3fff07efff',
                text: 'Please enter details about each family member.\n',
              },
            ],
          },
        ],
        codebook: {
          node: {
            '54532334-bfb9-4f54-9672-07931dd396a3': {
              name: 'Person',
              iconVariant: 'add-a-person',
              variables: {
                'bd054697-95f5-40de-8d40-d752b451d516': {
                  name: 'name',
                  type: 'text',
                  component: 'Text',
                  validation: { required: true },
                },
              },
              color: 'node-color-seq-1',
            },
          },
        },
        experiments: null,
        assets: [],
      },
    },
    meta: {
      values: {
        'startTime': ['Date'],
        'lastUpdated': ['Date'],
        'protocol.importedAt': ['Date'],
      },
    },
  });
};
