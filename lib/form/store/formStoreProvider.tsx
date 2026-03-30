'use client';

import { createContext, useRef, type ReactNode } from 'react';
import {
  createFormStore,
  type FormStoreApi,
  type FormStoreOptions,
} from './formStore';

export const FormStoreContext = createContext<FormStoreApi | undefined>(
  undefined,
);

type FormStoreProviderProps = {
  children: ReactNode;
} & FormStoreOptions;

const FormStoreProvider = ({
  children,
  debug,
  persistFieldValues,
}: FormStoreProviderProps) => {
  const storeRef = useRef<FormStoreApi>(undefined);

  storeRef.current ??= createFormStore({ debug, persistFieldValues });

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
};

export default FormStoreProvider;
