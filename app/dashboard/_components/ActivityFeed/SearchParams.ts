import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { activityTypes, sortableFields, sortOrder } from './types';

/**
 * URL namespace prefix for this table. Used by the client provider to
 * namespace URL params so multiple server-fetched tables can coexist on
 * the same page without colliding.
 */
export const ACTIVITY_FEED_PREFIX = 'af';

/**
 * Logical-name parsers — these are what the rest of the app sees. The
 * actual URL keys are prefixed via `urlKeys` so the URL stays
 * `?af_q=foo&af_type=...&af_page=2` etc.
 */
export const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('none'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  q: parseAsString,
  type: parseAsArrayOf(parseAsStringLiteral(activityTypes)),
};

export const searchParamsUrlKeys = {
  page: `${ACTIVITY_FEED_PREFIX}_page`,
  perPage: `${ACTIVITY_FEED_PREFIX}_perPage`,
  sort: `${ACTIVITY_FEED_PREFIX}_sort`,
  sortField: `${ACTIVITY_FEED_PREFIX}_sortField`,
  q: `${ACTIVITY_FEED_PREFIX}_q`,
  type: `${ACTIVITY_FEED_PREFIX}_type`,
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers, {
  urlKeys: searchParamsUrlKeys,
});
