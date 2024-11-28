import { compact, get } from 'lodash-es';
import { useMemo } from 'react';
import { mapNCType } from '../../../utils/createSorter';
import { convertNamesToUUIDs } from './helpers';

/**
 * Convert protocol config options into a format
 * usable by useSort. Essentially specific to SearchableList.
 */
const useSortableProperties = (
  variableDefinitions,
  sortOptions,
  path = ['data', 'attributes'],
) => {
  const sortableProperties = get(sortOptions, 'sortableProperties');
  const initialSortOrder = get(sortOptions, ['sortOrder', 0]);
  const initialSortProperty = get(initialSortOrder, 'property');

  const enhancedInitialSortOrder = useMemo(() => {
    const property = convertNamesToUUIDs(
      variableDefinitions,
      initialSortProperty,
    );
    const type = get(variableDefinitions, [property, 'type']);
    return {
      ...initialSortOrder,
      property: compact([...path, property]),
      type: mapNCType(type),
    };
  }, [initialSortOrder, initialSortProperty, variableDefinitions, path]);

  const enhancedSortableProperties = useMemo(() => {
    if (!sortableProperties) {
      return [];
    }
    return sortableProperties.map(({ variable, label }) => {
      const uuid = convertNamesToUUIDs(variableDefinitions, variable);
      const type = get(variableDefinitions, [uuid, 'type']);
      return {
        property: compact([...path, uuid]),
        label,
        type: mapNCType(type),
      };
    });
  }, [sortableProperties, variableDefinitions, path]);

  if (!sortOptions) {
    return { sortableProperties: [], initialSortOrder: undefined };
  }

  return {
    sortableProperties: enhancedSortableProperties,
    initialSortOrder: enhancedInitialSortOrder,
  };
};

export default useSortableProperties;
