import 'server-only';
import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import {
  buildInterviewOrderBy,
  buildInterviewWhere,
} from '~/app/dashboard/_components/InterviewsTable/buildInterviewWhere';
import type { InterviewsSearchParams } from '~/app/dashboard/_components/InterviewsTable/searchParams';

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

const NODE_SUMMARY_SQL = `COALESCE(
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
      )`;

const EDGE_SUMMARY_SQL = `COALESCE(
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
      )`;

function mapRawInterviewRow(row: RawInterviewRow): InterviewListRow {
  return {
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
  };
}

export type GetInterviewsQuery = InterviewListRow[];

export async function getInterviews(searchParams: InterviewsSearchParams) {
  'use cache';
  cacheLife('max');
  safeCacheTag('getInterviews');

  const where = buildInterviewWhere(searchParams);
  const orderBy = buildInterviewOrderBy(searchParams);
  const perPage = searchParams.perPage;
  const offset = searchParams.page > 0 ? (searchParams.page - 1) * perPage : 0;

  const rowsQuery = prisma.$queryRaw<RawInterviewRow[]>`
    SELECT
      i."id", i."startTime", i."finishTime", i."exportTime", i."lastUpdated",
      i."currentStep", i."protocolId", i."isSynthetic",
      par."identifier" AS "participantIdentifier",
      p."name" AS "protocolName",
      COALESCE(jsonb_array_length(p."stages"::jsonb), 0)::int AS "stageCount",
      ${Prisma.raw(NODE_SUMMARY_SQL)} AS "nodeSummary",
      ${Prisma.raw(EDGE_SUMMARY_SQL)} AS "edgeSummary"
    FROM "Interview" i
    JOIN "Protocol" p ON i."protocolId" = p."id"
    JOIN "Participant" par ON i."participantId" = par."id"
    ${where}
    ${orderBy}
    LIMIT ${perPage} OFFSET ${offset}
  `;

  const countQuery = prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Interview" i
    JOIN "Protocol" p ON i."protocolId" = p."id"
    JOIN "Participant" par ON i."participantId" = par."id"
    ${where}
  `;

  const [rawRows, countResult] = await Promise.all([rowsQuery, countQuery]);
  const totalCount = Number(countResult[0]?.count ?? 0);
  const rows = rawRows.map(mapRawInterviewRow);

  return {
    rows: stringify(rows),
    pageCount: Math.ceil(totalCount / perPage),
    totalCount,
  };
}

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;

export async function getInterviewFilterOptions() {
  'use cache';
  cacheLife('max');
  // Options derive from protocols (names + codebook node/edge types), so they
  // must refresh when protocols change — not when interviews are exported.
  safeCacheTag('getProtocols');

  const protocols = await prisma.protocol.findMany({
    select: { name: true, codebook: true },
  });

  const protocolNames = [...new Set(protocols.map((p) => p.name))].sort();

  const nodeTypes = new Map<string, string>();
  const edgeTypes = new Map<string, string>();
  for (const p of protocols) {
    for (const [type, def] of Object.entries(p.codebook.node ?? {})) {
      nodeTypes.set(type, def.name ?? type);
    }
    for (const [type, def] of Object.entries(p.codebook.edge ?? {})) {
      edgeTypes.set(type, def.name ?? type);
    }
  }

  return {
    protocolNames,
    nodeTypes: [...nodeTypes].map(([value, label]) => ({ value, label })),
    edgeTypes: [...edgeTypes].map(([value, label]) => ({ value, label })),
  };
}

export type InterviewFilterOptions = Awaited<
  ReturnType<typeof getInterviewFilterOptions>
>;

export async function getInterviewIdsMatching(
  searchParams: InterviewsSearchParams,
  extra?: { onlyUnexported?: boolean; onlyCompleted?: boolean },
): Promise<string[]> {
  const where = buildInterviewWhere(searchParams);
  const extraConditions: Prisma.Sql[] = [];
  if (extra?.onlyUnexported)
    extraConditions.push(Prisma.sql`i."exportTime" IS NULL`);
  if (extra?.onlyCompleted)
    extraConditions.push(Prisma.sql`i."finishTime" IS NOT NULL`);

  const extraSql =
    extraConditions.length > 0
      ? Prisma.sql`${where === Prisma.empty ? Prisma.sql`WHERE` : Prisma.sql`${where} AND`} ${Prisma.join(extraConditions, ' AND ')}`
      : where;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT i."id"
    FROM "Interview" i
    JOIN "Protocol" p ON i."protocolId" = p."id"
    JOIN "Participant" par ON i."participantId" = par."id"
    ${extraSql}
  `;
  return rows.map((r) => r.id);
}

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
