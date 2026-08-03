import { Prisma } from '~/lib/db/generated/client';
import type { ParticipantsSearchParams } from './searchParams';

/**
 * Builds the WHERE predicate (without the `WHERE` keyword) for the participant
 * list. Returns `Prisma.empty` when no filters are active. Column references
 * assume the alias `p` (Participant).
 */
export function buildParticipantWhere(
  params: ParticipantsSearchParams,
): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  if (params.q) {
    conditions.push(Prisma.sql`p."identifier" ILIKE '%' || ${params.q} || '%'`);
  }

  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

const DEFAULT_SORT_COLUMN = 'p."identifier"';

const INTERVIEW_COUNT_SQL =
  '(SELECT COUNT(*) FROM "Interview" iv WHERE iv."participantId" = p."id")';

const SORT_COLUMN: Record<string, string | undefined> = {
  identifier: 'p."identifier"',
  label: 'p."label"',
  interviews: INTERVIEW_COUNT_SQL,
};

export function buildParticipantOrderBy(
  params: ParticipantsSearchParams,
): Prisma.Sql {
  if (params.sort === 'none') {
    return Prisma.sql`ORDER BY p."identifier" ASC, p."id" ASC`;
  }
  const col = SORT_COLUMN[params.sortField] ?? DEFAULT_SORT_COLUMN;
  const dir = params.sort === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC');
  return Prisma.sql`ORDER BY ${Prisma.raw(col)} ${dir}, p."id" ASC`;
}
