import { useMemo, useState } from 'react';
import { get } from '@codaco/utils';

const defaultSortOrder = {
  direction: 'asc',
  property: null,
};

/**
 * Sort a list of items
 *
 * Expects `list` to be in format:
 * `[{ data, ... }, ...]`
 *
 * Any properties on `data` can be specified as the `sortByProperty`.
 *
 * Sort direction is either 'asc' or 'desc'.
 *
 * For initialSortOrder, direction is optional.
 *
 * Usage:
 *
 * const [
 *  sorted,
 *  sortProperty,
 *  sortDirection,
 *  setProperty,
 *  toggleDirection,
 * ] = useSort(list, { property: 'name', direction: 'asc'});
 */
const useSort = (list, initialSortOrder = defaultSortOrder) => {
  const { property: initialSortBy, direction: initialDirection } = initialSortOrder;
  const [sortByProperty, setSortByProperty] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  const toggleSortDirection = () => setSortDirection(
    (d) => (d === 'desc' ? 'asc' : 'desc'),
  );

  const updateSortByProperty = (property) => {
    if (property === sortByProperty) {
      toggleSortDirection();
      return;
    }

    setSortByProperty(property);
    setSortDirection(defaultSortOrder.direction);
  };

  const sortedList = useMemo(() => {
    if (!sortByProperty) { return list; }

    const sorted = list.sort((a, b) => {
      const aValue = get(a, sortByProperty);
      const bValue = get(b, sortByProperty);

      if (aValue < bValue) { return -1; }
      if (aValue > bValue) { return 1; }
      return 0;
    });

    return sortDirection === 'desc'
      ? sorted.reverse()
      : sorted;
  }, [list, sortByProperty, sortDirection]);

  return [sortedList, sortByProperty, sortDirection, updateSortByProperty, toggleSortDirection];
};
export default useSort;
