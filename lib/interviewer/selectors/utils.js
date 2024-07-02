import { isEqual } from 'lodash';
import { createSelectorCreator, lruMemoize } from 'reselect';

// create a "selector creator" that uses lodash.isEqual instead of ===
export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual,
);
