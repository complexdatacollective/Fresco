import 'server-only';
import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import {
  buildParticipantOrderBy,
  buildParticipantWhere,
} from '~/app/dashboard/_components/ParticipantsTable/buildParticipantWhere';
import type { ParticipantsSearchParams } from '~/app/dashboard/_components/ParticipantsTable/searchParams';

type ParticipantInterviewSummary = {
  finishTime: Date | null;
  exportTime: Date | null;
};

type ParticipantListRow = {
  id: string;
  identifier: string;
  label: string | null;
  interviews: ParticipantInterviewSummary[];
  _count: { interviews: number };
};

type RawParticipantRow = {
  id: string;
  identifier: string;
  label: string | null;
  interviewCount: number;
  interviews: { finishTime: string | null; exportTime: string | null }[];
};

// Aggregates the minimal interview fields the table cells need (completed count
// via finishTime, unexported warning via exportTime) without pulling network
// blobs, which previously made this query uncacheable.
const INTERVIEW_SUMMARY_SQL = `COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'finishTime', iv."finishTime",
          'exportTime', iv."exportTime"
        ))
        FROM "Interview" iv
        WHERE iv."participantId" = p."id"),
        '[]'::jsonb
      )`;

function toDate(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

function mapRawParticipantRow(row: RawParticipantRow): ParticipantListRow {
  return {
    id: row.id,
    identifier: row.identifier,
    label: row.label,
    interviews: row.interviews.map((interview) => ({
      finishTime: toDate(interview.finishTime),
      exportTime: toDate(interview.exportTime),
    })),
    _count: { interviews: row.interviewCount },
  };
}

export type GetParticipantsQuery = ParticipantListRow[];

export async function getParticipants(searchParams: ParticipantsSearchParams) {
  'use cache';
  cacheLife('max');
  safeCacheTag('getParticipants');

  const where = buildParticipantWhere(searchParams);
  const orderBy = buildParticipantOrderBy(searchParams);
  const perPage = searchParams.perPage;
  const offset = searchParams.page > 0 ? (searchParams.page - 1) * perPage : 0;

  const rowsQuery = prisma.$queryRaw<RawParticipantRow[]>`
    SELECT
      p."id", p."identifier", p."label",
      (SELECT COUNT(*) FROM "Interview" iv WHERE iv."participantId" = p."id")::int AS "interviewCount",
      ${Prisma.raw(INTERVIEW_SUMMARY_SQL)} AS "interviews"
    FROM "Participant" p
    ${where}
    ${orderBy}
    LIMIT ${perPage} OFFSET ${offset}
  `;

  const countQuery = prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Participant" p
    ${where}
  `;

  const [rawRows, countResult] = await Promise.all([rowsQuery, countQuery]);
  const totalCount = Number(countResult[0]?.count ?? 0);
  const rows = rawRows.map(mapRawParticipantRow);

  return {
    rows: stringify(rows),
    pageCount: Math.ceil(totalCount / perPage),
    totalCount,
  };
}

export type GetParticipantsReturnType = ReturnType<typeof getParticipants>;

export async function getParticipantIdsMatching(
  searchParams: ParticipantsSearchParams,
): Promise<string[]> {
  const where = buildParticipantWhere(searchParams);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p."id"
    FROM "Participant" p
    ${where}
  `;
  return rows.map((r) => r.id);
}

async function prisma_getParticipantsForSelect() {
  return prisma.participant.findMany({
    orderBy: { identifier: 'asc' },
  });
}

export type GetParticipantsForSelectQuery = Awaited<
  ReturnType<typeof prisma_getParticipantsForSelect>
>;

/**
 * Lightweight full list of participants (no interviews) for select dropdowns
 * and uniqueness checks. Kept separate from the paged `getParticipants` so
 * those consumers still receive every participant without the network blobs.
 */
export async function getParticipantsForSelect() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getParticipants');

  const participants = await prisma_getParticipantsForSelect();
  return stringify(participants);
}

export type GetParticipantsForSelectReturnType = ReturnType<
  typeof getParticipantsForSelect
>;
