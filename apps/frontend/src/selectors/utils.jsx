import { createSelectorCreator, defaultMemoize } from '@reduxjs/toolkit';
import { isEqual } from '@codaco/utils';

// create a "selector creator" that uses isEqual instead of ===
export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);