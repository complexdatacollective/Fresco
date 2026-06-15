import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { z } from 'zod/mini';

export const INTERVIEWS_PREFIX = 'iv';

export const sortOrder = ['asc', 'desc', 'none'] as const;
export const sortableFields = [
  'identifier',
  'protocolName',
  'startTime',
  'lastUpdated',
  'exportTime',
  'progress',
] as const;

// Network operator filter condition shape (matches fresco-ui OperatorCondition).
const networkConditionSchema = z.array(
  z.object({
    entityKind: z.enum(['nodes', 'edges']),
    entityType: z.string(),
    operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte']),
    value: z.number(),
  }),
);
export type NetworkCondition = z.infer<typeof networkConditionSchema>[number];

const parseNetwork = parseAsJson((v) => networkConditionSchema.parse(v));

export const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('none'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('lastUpdated'),
  q: parseAsString,
  protocol: parseAsArrayOf(parseAsString),
  started: parseAsString, // "fromISO..toISO"
  updated: parseAsString, // "fromISO..toISO"
  progress: parseAsString, // "min..max"
  exported: parseAsBoolean,
  network: parseNetwork,
};

export const searchParamsUrlKeys = Object.fromEntries(
  Object.keys(searchParamsParsers).map((k) => [k, `${INTERVIEWS_PREFIX}_${k}`]),
) as Record<keyof typeof searchParamsParsers, string>;

export const searchParamsCache = createSearchParamsCache(searchParamsParsers, {
  urlKeys: searchParamsUrlKeys,
});

export type InterviewsSearchParams = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
