import { compact } from 'es-toolkit';
import { isEmpty } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeVariables } from '~/lib/interviewer/selectors/interface';
import { getSearchOptions } from '~/lib/interviewer/selectors/name-generator';
import { convertNamesToUUIDs } from './helpers';

const defaultFuseOptions = {
  keys: [['props', 'label']],
  threshold: 0,
};

/**
 * Convert protocol config options into a format
 * usable by SearchableList.
 */
const useFuseOptions = (
  fallbackFuseOptions = defaultFuseOptions,
  path = ['data', 'attributes'],
) => {
  const stageSearchOptions = useSelector(getSearchOptions);
  const nodeVariables = useSelector(getNodeVariables);

  const searchOptions = ((options) => {
    if (!options || isEmpty(options)) {
      return options;
    }

    return {
      ...options,
      matchProperties: convertNamesToUUIDs(
        nodeVariables,
        stageSearchOptions?.matchProperties ?? [],
      ),
    };
  })(stageSearchOptions);

  const keys = useMemo(
    () =>
      searchOptions?.matchProperties.map((property) =>
        compact([...path, property]),
      ),
    [searchOptions?.matchProperties, path],
  );

  if (!searchOptions || isEmpty(searchOptions)) {
    return fallbackFuseOptions;
  }

  const fuseOptions = {
    ...(searchOptions?.fuzziness && {
      threshold: searchOptions?.fuzziness,
    }),
    keys,
  };

  return fuseOptions;
};

export default useFuseOptions;
