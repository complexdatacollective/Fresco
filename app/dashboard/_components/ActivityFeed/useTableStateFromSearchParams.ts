'use client';

import { useQueryState } from 'nuqs';
import { parsers } from './searchParamsCache';

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
  const [page, setPage] = useQueryState('page', parsers.page);
  const [perPage, setPerPage] = useQueryState('perPage', parsers.perPage);
  const [sort, setSort] = useQueryState('sort', parsers.sort);
  const [sortField, setSortField] = useQueryState(
    'sortField',
    parsers.sortField,
  );

  const [filterParams, setFilterParams] = useQueryState(
    'filterParams',
    parsers.filterParams,
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
