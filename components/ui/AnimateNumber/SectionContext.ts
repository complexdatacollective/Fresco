import { createContext } from 'react';

export type SectionContextValue = {
  justify: 'left' | 'right';
};

export const SectionContext = createContext<SectionContextValue>({
  justify: 'left',
});
