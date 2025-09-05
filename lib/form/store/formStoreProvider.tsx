'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { type ZodType } from 'zod';
import { useStore } from 'zustand';
import {
  createFormStore,
  type FormStore,
  type FormStoreApi,
} from './formStore';

const FormStoreContext = createContext<FormStoreApi | undefined>(undefined);

export type FormStoreProviderProps = {
  children: ReactNode;
};

export const FormStoreProvider = ({ children }: FormStoreProviderProps) => {
  const storeRef = useRef<FormStoreApi>();

  storeRef.current ??= createFormStore();

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
};

export const useFormStore = <T,>(
  selector: (store: FormStore<ZodType<unknown>>) => T,
): T => {
  const formStoreContext = useContext(FormStoreContext);

  if (!formStoreContext) {
    throw new Error('useFormStore must be used within FormStoreProvider');
  }

  return useStore(formStoreContext, selector);
};

export const useFormStoreSelector = <T,>(
  selector: (store: FormStore<ZodType<unknown>>) => T,
): T => {
  const formStoreContext = useContext(FormStoreContext);

  if (!formStoreContext) {
    throw new Error(
      'useFormStoreSelector must be used within FormStoreProvider',
    );
  }

  return useStore(formStoreContext, selector);
};
