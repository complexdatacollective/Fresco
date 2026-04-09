'use client';

import { createContext, useRef, type ReactNode } from 'react';
import { createFormStore, type FormStoreApi } from './formStore';

export const FormStoreContext = createContext<FormStoreApi | undefined>(
  undefined,
);

type FormStoreProviderProps = {
  children: ReactNode;
};

const FormStoreProvider = ({ children }: FormStoreProviderProps) => {
  const storeRef = useRef<FormStoreApi>(undefined);

  storeRef.current ??= createFormStore();

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
};

export default FormStoreProvider;
