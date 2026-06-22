import { Prisma } from '~/lib/db/generated/client';
import type { InterviewsSearchParams, NetworkCondition } from './searchParams';

function parseRange(raw: string | null): { lo: string; hi: string } | null {
  if (!raw) return null;
  const [lo, hi] = raw.split('..');
  if (lo === undefined || hi === undefined || lo === '' || hi === '') {
    return null;
  }
  return { lo, hi };
}

function operatorSql(op: NetworkCondition['operator']): Prisma.Sql {
  switch (op) {
    case 'eq':
      return Prisma.raw('=');
    case 'gt':
      return Prisma.raw('>');
    case 'lt':
      return Prisma.raw('<');
    case 'gte':
      return Prisma.raw('>=');
    case 'lte':
      return Prisma.raw('<=');
  }
}

/**
 * Progress percentage expression mirroring `computeInterviewProgress`: a
 * finished interview (finishTime set) is 100%, otherwise progress is derived
 * from currentStep / protocol stage count. Assumes the aliases `i` (Interview)
 * and `p` (Protocol).
 */
const PROGRESS_SQL =
  '(CASE WHEN i."finishTime" IS NOT NULL THEN 100 WHEN COALESCE(jsonb_array_length(p."stages"::jsonb),0) > 0 THEN (i."currentStep"::float / jsonb_array_length(p."stages"::jsonb)) * 100 ELSE 0 END)';

/**
 * Builds the WHERE predicate (without the `WHERE` keyword) for the interview
 * list. Returns `Prisma.empty` when no filters are active. Column references
 * assume the aliases `i` (Interview), `p` (Protocol), `par` (Participant).
 */
export function buildInterviewWhere(
  params: InterviewsSearchParams,
): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  if (params.q) {
    conditions.push(
      Prisma.sql`par."identifier" ILIKE '%' || ${params.q} || '%'`,
    );
  }

  if (params.protocol && params.protocol.length > 0) {
    conditions.push(Prisma.sql`p."name" IN (${Prisma.join(params.protocol)})`);
  }

  const started = parseRange(params.started);
  if (started) {
    // Upper bound extended to end of day so date-only "to" values are inclusive.
    conditions.push(
      Prisma.sql`i."startTime" >= ${new Date(started.lo)} AND i."startTime" <= ${new Date(`${started.hi}T23:59:59.999`)}`,
    );
  }

  const updated = parseRange(params.updated);
  if (updated) {
    // Upper bound extended to end of day so date-only "to" values are inclusive.
    conditions.push(
      Prisma.sql`i."lastUpdated" >= ${new Date(updated.lo)} AND i."lastUpdated" <= ${new Date(`${updated.hi}T23:59:59.999`)}`,
    );
  }

  const progress = parseRange(params.progress);
  if (progress) {
    const min = Number(progress.lo);
    const max = Number(progress.hi);
    conditions.push(
      Prisma.sql`${Prisma.raw(PROGRESS_SQL)} BETWEEN ${min} AND ${max}`,
    );
  }

  if (params.exported !== null) {
    conditions.push(
      params.exported
        ? Prisma.sql`i."exportTime" IS NOT NULL`
        : Prisma.sql`i."exportTime" IS NULL`,
    );
  }

  if (params.network && params.network.length > 0) {
    // AND-combine each condition (see filterFns.js verification note).
    for (const c of params.network) {
      conditions.push(
        Prisma.sql`(SELECT COUNT(*) FROM jsonb_array_elements(
            COALESCE(i."network"->${c.entityKind}, '[]'::jsonb)) AS e
          WHERE e->>'type' = ${c.entityType}) ${operatorSql(c.operator)} ${c.value}`,
      );
    }
  }

  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

const DEFAULT_SORT_COLUMN = 'i."lastUpdated"';

const SORT_COLUMN: Record<string, string | undefined> = {
  identifier: 'par."identifier"',
  protocolName: 'p."name"',
  startTime: 'i."startTime"',
  lastUpdated: 'i."lastUpdated"',
  exportTime: 'i."exportTime"',
  progress: PROGRESS_SQL,
};

export function buildInterviewOrderBy(
  params: InterviewsSearchParams,
): Prisma.Sql {
  if (params.sort === 'none') {
    return Prisma.sql`ORDER BY i."lastUpdated" DESC, i."id" DESC`;
  }
  const col = SORT_COLUMN[params.sortField] ?? DEFAULT_SORT_COLUMN;
  const dir = params.sort === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC');
  return Prisma.sql`ORDER BY ${Prisma.raw(col)} ${dir}, i."id" DESC`;
}
