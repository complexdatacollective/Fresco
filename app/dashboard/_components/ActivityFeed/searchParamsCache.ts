import {
  FilterParam,
  pageSizes,
  sortOrder,
  sortableFields,
} from '~/lib/data-table/types';

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsNumberLiteral,
  parseAsStringLiteral,
} from 'nuqs';
import { createSearchParamsCache } from 'nuqs/server';

export const parsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsNumberLiteral(pageSizes).withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('desc'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  filterParams: parseAsArrayOf(
    parseAsJson((value) => FilterParam.parse(value)),
  ),
};

export const searchParamsCache = createSearchParamsCache(parsers);
