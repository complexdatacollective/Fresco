import { createContext } from 'react';

type SectionContextValue = {
  justify: 'left' | 'right';
};

export const SectionContext = createContext<SectionContextValue>({
  justify: 'left',
});
