import 'server-only';
import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

type NetworkSummaryEntry = {
  type: string;
  count: number;
  name: string;
  color?: string;
};

type InterviewNetworkSummary = {
  nodes: NetworkSummaryEntry[];
  edges: NetworkSummaryEntry[];
};

type InterviewListRow = {
  id: string;
  startTime: Date;
  finishTime: Date | null;
  exportTime: Date | null;
  lastUpdated: Date;
  currentStep: number;
  protocolId: string;
  isSynthetic: boolean;
  participant: { identifier: string };
  protocol: { name: string; stageCount: number };
  network: InterviewNetworkSummary;
};

type RawInterviewRow = {
  id: string;
  startTime: Date;
  finishTime: Date | null;
  exportTime: Date | null;
  lastUpdated: Date;
  currentStep: number;
  protocolId: string;
  isSynthetic: boolean;
  participantIdentifier: string;
  protocolName: string;
  stageCount: number;
  nodeSummary: NetworkSummaryEntry[];
  edgeSummary: NetworkSummaryEntry[];
};

async function prisma_getInterviews(): Promise<InterviewListRow[]> {
  const rows = await prisma.$queryRaw<RawInterviewRow[]>`
    SELECT
      i."id",
      i."startTime",
      i."finishTime",
      i."exportTime",
      i."lastUpdated",
      i."currentStep",
      i."protocolId",
      i."isSynthetic",
      par."identifier" AS "participantIdentifier",
      p."name" AS "protocolName",
      COALESCE(jsonb_array_length(p."stages"::jsonb), 0)::int AS "stageCount",
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'type', node_type,
          'count', cnt,
          'name', COALESCE(p."codebook"->'node'->node_type->>'name', 'Unknown'),
          'color', p."codebook"->'node'->node_type->>'color'
        ))
        FROM (
          SELECT n->>'type' AS node_type, COUNT(*)::int AS cnt
          FROM jsonb_array_elements(COALESCE(i."network"->'nodes', '[]'::jsonb)) AS n
          GROUP BY n->>'type'
        ) node_counts),
        '[]'::jsonb
      ) AS "nodeSummary",
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'type', edge_type,
          'count', cnt,
          'name', COALESCE(p."codebook"->'edge'->edge_type->>'name', 'Unknown'),
          'color', p."codebook"->'edge'->edge_type->>'color'
        ))
        FROM (
          SELECT e->>'type' AS edge_type, COUNT(*)::int AS cnt
          FROM jsonb_array_elements(COALESCE(i."network"->'edges', '[]'::jsonb)) AS e
          GROUP BY e->>'type'
        ) edge_counts),
        '[]'::jsonb
      ) AS "edgeSummary"
    FROM "Interview" i
    JOIN "Protocol" p ON i."protocolId" = p."id"
    JOIN "Participant" par ON i."participantId" = par."id"
    ORDER BY i."lastUpdated" DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    startTime: row.startTime,
    finishTime: row.finishTime,
    exportTime: row.exportTime,
    lastUpdated: row.lastUpdated,
    currentStep: row.currentStep,
    protocolId: row.protocolId,
    isSynthetic: row.isSynthetic,
    participant: { identifier: row.participantIdentifier },
    protocol: { name: row.protocolName, stageCount: row.stageCount },
    network: {
      nodes: row.nodeSummary,
      edges: row.edgeSummary,
    },
  }));
}

export type GetInterviewsQuery = InterviewListRow[];

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
