import { compact, isEqual } from 'es-toolkit';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { convertNamesToUUIDs } from '../containers/Interfaces/NameGeneratorRoster/helpers';
import { type UseItemElement } from '../containers/Interfaces/NameGeneratorRoster/useItems';
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
  ReturnType<typeof enhancedSortableProperties>,
] => {
  const nodeVariables = useSelector(getNodeVariables);
  const sortOptions = useSelector(getSortOptions);
  const sortOrder = sortOptions?.sortOrder ?? [];

  // Enhance
  const enhancedInitialSortOrder = () => {
    const initialProperty = sortOrder[0]?.property
      ? [sortOrder[0].property]
      : defaultSortOrder.property;
    const property = convertNamesToUUIDs(nodeVariables, initialProperty)[0];
    const type = nodeVariables?.property?.type;

    return {
      direction: sortOrder[0]?.direction ?? defaultSortOrder.direction,
      property: compact([...path, property]),
      type: mapNCType(type),
    };
  };

  const initialSortOrder = enhancedInitialSortOrder();

  const enhancedSortableProperties = () => {
    return sortOptions?.sortableProperties?.map(({ variable, label }) => {
      const uuid = convertNamesToUUIDs(nodeVariables, [variable])[0];
      const type = nodeVariables?.uuid?.type;

      return {
        property: compact([...path, uuid]),
        label,
        type: mapNCType(type),
      };
    });
  };

  const sortableProperties = enhancedSortableProperties();

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

  return [
    sortedList,
    sortByProperty,
    sortDirection,
    updateSortByProperty,
    setSortType,
    setSortDirection,
    sortableProperties,
  ];
};

export default useSort;
