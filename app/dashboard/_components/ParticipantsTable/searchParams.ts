import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

export const PARTICIPANTS_PREFIX = 'pt';

export const sortOrder = ['asc', 'desc', 'none'] as const;
export const sortableFields = ['identifier', 'label', 'interviews'] as const;

export const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('none'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('identifier'),
  q: parseAsString,
};

export const searchParamsUrlKeys = Object.fromEntries(
  Object.keys(searchParamsParsers).map((k) => [
    k,
    `${PARTICIPANTS_PREFIX}_${k}`,
  ]),
) as Record<keyof typeof searchParamsParsers, string>;

export const searchParamsCache = createSearchParamsCache(searchParamsParsers, {
  urlKeys: searchParamsUrlKeys,
});

export type ParticipantsSearchParams = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
