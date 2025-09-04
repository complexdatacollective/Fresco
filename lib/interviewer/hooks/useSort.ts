import { compact, flatten, isEqual } from 'es-toolkit';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { convertNamesToUUIDs } from '../Interfaces/NameGeneratorRoster/helpers';
import { type UseItemElement } from '../Interfaces/NameGeneratorRoster/useItems';
import { getNodeVariables } from '../selectors/interface';
import { getSortOptions } from '../selectors/name-generator';
import createSorter, {
  mapNCType,
  type Direction,
  type SortType,
} from '../utils/createSorter';

const path = ['data', 'attributes'];

const defaultSortOrder = {
  direction: 'asc',
  property: ['data', 'attributes', 'name'],
  type: 'string',
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
const useSort = (
  list: UseItemElement[],
): [
  UseItemElement[],
  string | string[] | undefined,
  Direction,
  (newProperty?: string | string[]) => void,
  (newType: SortType) => void,
  (newDirection: Direction) => void,
  { property: string[]; label: string; type: SortType }[] | undefined,
  () => void,
] => {
  const nodeVariables = useSelector(getNodeVariables);
  const stageSortOptions = useSelector(getSortOptions);
  const stageSortOrder = useMemo(
    () => stageSortOptions?.sortOrder ?? [],
    [stageSortOptions],
  );

  // Enhance
  const initialSortOrder = useMemo(() => {
    const initialProperty = stageSortOrder[0]?.property
      ? [stageSortOrder[0].property]
      : defaultSortOrder.property;
    const property = convertNamesToUUIDs(nodeVariables, initialProperty)[0];
    const type = nodeVariables?.property?.type;

    return {
      direction: stageSortOrder[0]?.direction ?? defaultSortOrder.direction,
      property: compact([...path, property]),
      type: mapNCType(type),
    };
  }, [stageSortOrder, nodeVariables]);

  const sortableProperties = useMemo(() => {
    return stageSortOptions?.sortableProperties?.map(({ variable, label }) => {
      const uuid = convertNamesToUUIDs(nodeVariables, [variable]);
      const type = nodeVariables?.uuid?.type;

      return {
        property: flatten(compact([...path, uuid])),
        label,
        type: mapNCType(type),
      };
    });
  }, [stageSortOptions, nodeVariables]);

  const [sortByProperty, setSortByProperty] = useState<
    string | string[] | undefined
  >(initialSortOrder.property);
  const [sortType, setSortType] = useState<SortType>(initialSortOrder.type);
  const [sortDirection, setSortDirection] = useState<Direction>(
    initialSortOrder.direction as Direction,
  );

  const toggleSortDirection = () =>
    setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));

  const updateSortByProperty = (newProperty?: string | string[]) => {
    // If no property, reset to initial
    if (!newProperty) {
      setSortByProperty(initialSortOrder.property);
      setSortDirection(initialSortOrder.direction as Direction);
      return;
    }

    // If property already selected, change direction only
    if (isEqual(newProperty, sortByProperty)) {
      toggleSortDirection();
      return;
    }

    // Otherwise, set property and default direction
    setSortByProperty(newProperty);
    setSortDirection(defaultSortOrder.direction as Direction);
  };

  const sortedList = useMemo(() => {
    if (!sortByProperty) {
      return list;
    }

    const rule = {
      property: sortByProperty,
      direction: sortDirection,
      type: sortType,
    };

    const sorter = createSorter<UseItemElement>([rule]);

    return sorter(list);
  }, [list, sortByProperty, sortDirection, sortType]);

  const reset = useCallback(() => {
    setSortByProperty(initialSortOrder.property);
    setSortDirection(initialSortOrder.direction as Direction);
    setSortType(initialSortOrder.type);
  }, [initialSortOrder]);

  return [
    sortedList,
    sortByProperty,
    sortDirection,
    updateSortByProperty,
    setSortType,
    setSortDirection,
    sortableProperties,
    reset,
  ];
};

export default useSort;
