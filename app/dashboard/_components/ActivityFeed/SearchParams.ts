import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
} from 'nuqs/server';
import { FilterParam } from '~/components/DataTable/types';
import { sortableFields, sortOrder } from './types';

export const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsStringLiteral(sortOrder).withDefault('none'),
  sortField: parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  filterParams: parseAsArrayOf(
    parseAsJson((value) => FilterParam.parse(value)),
  ),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
