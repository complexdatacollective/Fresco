import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
} from 'nuqs/server';
import { FilterParam, sortOrder, sortableFields } from '~/lib/data-table/types';

export const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('desc'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  filterParams: parseAsArrayOf(
    parseAsJson((value) => FilterParam.parse(value)),
  ),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
