'use client';
import {
  FilterParam,
  pageSizes,
  searchableFields,
  sortOrder,
  sortableFields,
} from '~/lib/data-table/types';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';

/**
 * This hook implements the table state items required by the DataTable.
 *
 * Ultimately, we could abstract this further, and implement a generic
 * useSearchParamsTableState hook so that the way the state is stored is an
 * implementation detail. This would allow us to store table state in novel
 * ways, such as in localStorage, in the URL, or even in a database.
 *
 */
export const useTableStateFromSearchParams = () => {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState(
    'per_page',
    parseAsNumberLiteral(pageSizes).withDefault(10),
  );
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(sortOrder).withDefault('desc'),
  );
  const [sortField, setSortField] = useQueryState(
    'sort_field',
    parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  );

  const [filterParams, setFilterParams] = useQueryState(
    'filter_params',
    parseAsArrayOf(parseAsJson((value) => FilterParam.parse(value))),
  );

  return {
    searchParams: {
      page,
      perPage,
      sort,
      sortField,
      filterParams,
    },
    setSearchParams: {
      setPage,
      setPerPage,
      setSort,
      setSortField,
      setFilterParams,
    },
  };
};
