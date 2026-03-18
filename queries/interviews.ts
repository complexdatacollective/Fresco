import 'server-only';
import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

/**
 * Define the Prisma query logic for fetching all interviews separately
 * to infer the type from the return value.
 */
type NetworkSummaryEntry = {
  type: string;
  count: number;
};

type InterviewNetworkSummary = {
  nodes: NetworkSummaryEntry[];
  edges: NetworkSummaryEntry[];
};

function summarizeNetwork(
  network: Record<string, unknown> | null,
): InterviewNetworkSummary {
  if (!network) return { nodes: [], edges: [] };

  const nodes = Array.isArray(network.nodes) ? network.nodes : [];
  const edges = Array.isArray(network.edges) ? network.edges : [];

  const countByType = (items: unknown[]): NetworkSummaryEntry[] => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item === null || typeof item !== 'object') continue;
      const type =
        'type' in item && typeof item.type === 'string' ? item.type : 'unknown';
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()].map(([type, count]) => ({ type, count }));
  };

  return {
    nodes: countByType(nodes),
    edges: countByType(edges),
  };
}

async function prisma_getInterviews() {
  const interviews = await prisma.interview.findMany({
    select: {
      id: true,
      startTime: true,
      finishTime: true,
      exportTime: true,
      lastUpdated: true,
      currentStep: true,
      protocolId: true,
      network: true,
      isSynthetic: true,
      participant: {
        select: {
          identifier: true,
        },
      },
      protocol: {
        select: {
          name: true,
          stages: true,
          codebook: true,
        },
      },
    },
  });

  return interviews.map((interview) => ({
    ...interview,
    network: summarizeNetwork(
      interview.network as Record<string, unknown> | null,
    ),
  }));
}

export type GetInterviewsQuery = Awaited<
  ReturnType<typeof prisma_getInterviews>
>;

export async function getInterviews() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getInterviews');

  const interviews = await prisma_getInterviews();
  const safeInterviews = stringify(interviews);
  return safeInterviews;
}

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
  return prisma_getInterviewsForExport(interviewIds);
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
  // and it contains a Date object.
  return stringify({
    ...interview,
  });
};
