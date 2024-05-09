import { isEqual } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';

// create a "selector creator" that uses lodash.isEqual instead of ===
export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);
