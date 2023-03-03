import { get } from '@codaco/utils';

// eslint-disable-next-line import/prefer-default-export
export const getTwoModeLayoutVariable = (twoMode, nodeType, layout) => {
  if (!twoMode) { return layout; }

  return get(layout, nodeType, null);
};
