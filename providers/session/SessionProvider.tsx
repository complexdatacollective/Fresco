'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';

import {
  type CounterStore,
  createCounterStore,
  initCounterStore,
} from './store';

export const CounterStoreContext = createContext();

export interface CounterStoreProviderProps {
  children: ReactNode;
}

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const storeRef = useRef<CounterStore>();
  if (!storeRef.current) {
    storeRef.current = createCounterStore(initCounterStore());
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  );
};

export const useCounterStore = (selector: (store: CounterStore) => T): T => {
  const counterStoreContext = useContext(CounterStoreContext);

  if (counterStoreContext === undefined) {
    throw new Error(`useCounterStore must be use within CounterStoreProvider`);
  }

  return useStore(counterStoreContext, selector);
};
