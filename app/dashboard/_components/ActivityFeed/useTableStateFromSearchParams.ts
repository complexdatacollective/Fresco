'use client';
import { useQueryStates } from 'nuqs';
import { searchParamsParsers } from './SearchParams';

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
  const [{ page, perPage, sort, sortField, filterParams }, setSearchParams] =
    useQueryStates(searchParamsParsers);

  return {
    searchParams: {
      page,
      perPage,
      sort,
      sortField,
      filterParams,
    },
    setSearchParams,
  };
};
