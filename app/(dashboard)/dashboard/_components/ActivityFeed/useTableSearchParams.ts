'use client';
import {
  activityTypes,
  pageSizes,
  sortOrder,
  sortableFields,
} from '~/lib/data-table/types';
import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';

export const useTableSearchParams = () => {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState(
    'per_page',
    parseAsNumberLiteral(pageSizes).withDefault(20),
  );
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(sortOrder).withDefault('desc'),
  );
  const [sortField, setSortField] = useQueryState(
    'sort_field',
    parseAsStringLiteral(sortableFields).withDefault('timestamp'),
  );
  const [type, setType] = useQueryState(
    'type',
    parseAsStringLiteral(activityTypes),
  );
  const [message, setMessage] = useQueryState('message');

  return {
    searchParams: {
      page,
      perPage,
      sort,
      sortField,
      type,
      message,
    },
    setSearchParams: {
      setPage,
      setPerPage,
      setSort,
      setSortField,
      setType,
      setMessage,
    },
  };
};
