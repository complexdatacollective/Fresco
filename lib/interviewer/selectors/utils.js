import { isEqual } from 'es-toolkit';
import { createSelectorCreator, defaultMemoize } from 'reselect';

// create a "selector creator" that uses lodash.isEqual instead of ===
export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);
