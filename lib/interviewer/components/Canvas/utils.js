import { get } from 'lodash-es';

export const getTwoModeLayoutVariable = (twoMode, nodeType, layout) => {
  if (!twoMode) {
    return layout;
  }

  return get(layout, nodeType, null);
};
