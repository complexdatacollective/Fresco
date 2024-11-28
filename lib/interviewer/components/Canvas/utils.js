import { get } from 'es-toolkit/compat';

export const getTwoModeLayoutVariable = (twoMode, nodeType, layout) => {
  if (!twoMode) {
    return layout;
  }

  return get(layout, nodeType, null);
};
