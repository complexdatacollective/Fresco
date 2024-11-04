import { compact, get, isEmpty } from 'lodash-es';
import { useMemo } from 'react';

const defaultFuseOptions = {
  keys: [['props', 'label']],
  threshold: 0,
};

/**
 * Convert protocol config options into a format
 * usable by SearchableList.
 */
const useFuseOptions = (
  searchOptions,
  fallbackFuseOptions = defaultFuseOptions,
  path = ['data', 'attributes'],
) => {
  const matchProperties = get(searchOptions, 'matchProperties', []);
  const fuzziness = get(searchOptions, 'fuzziness');

  const keys = useMemo(
    () => matchProperties.map((property) => compact([...path, property])),
    [matchProperties, path],
  );

  if (!searchOptions || isEmpty(searchOptions)) {
    return fallbackFuseOptions;
  }

  const fuseOptions = {
    ...(typeof fuzziness === 'number' && {
      threshold: fuzziness,
    }),
    keys,
  };

  return fuseOptions;
};

export default useFuseOptions;
