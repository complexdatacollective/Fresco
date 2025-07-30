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

  //return safeInterview;
  return JSON.stringify({"json":{"id":"cmdhi7mkw000bp52y1hvcxf28","startTime":"2025-07-24T14:44:54.413Z","finishTime":null,"exportTime":null,"lastUpdated":"2025-07-24T14:44:54.413Z","network":{"nodes":[],"edges":[],"ego":{"_uid":"612f34b6-6cfe-442f-a34d-530e1bf61666","attributes":{}}},"participantId":"cmdhi7mkw000cp52yudbrfyf2","protocolId":"cmdhi7ali0009p52ykn9232pu","currentStep":0,"stageMetadata":null,"protocol":{"id":"cmdhi7ali0009p52ykn9232pu","name":"Protocol.netcanvas","schemaVersion":7,"description":null,"importedAt":"2025-07-24T14:44:38.886Z","stages":[{"id":"56c0f070-689b-11f0-bd76-9b8c0f425a31","label":"Example","type":"FamilyTreeCensus","quickAdd":"bd054697-95f5-40de-8d40-d752b451d516","subject":{"entity":"node","type":"54532334-bfb9-4f54-9672-07931dd396a3"},"prompts":[{"id":"eacfcdfc-1a80-4483-86fe-0e5846b99093","text":"hi\n"}]}],"codebook":{"node":{"54532334-bfb9-4f54-9672-07931dd396a3":{"name":"Person","iconVariant":"add-a-person","variables":{"bd054697-95f5-40de-8d40-d752b451d516":{"name":"foo","type":"text"}},"color":"node-color-seq-1"}}},"experiments":null,"assets":[]}},"meta":{"values":{"startTime":["Date"],"lastUpdated":["Date"],"protocol.importedAt":["Date"]}}});
};
