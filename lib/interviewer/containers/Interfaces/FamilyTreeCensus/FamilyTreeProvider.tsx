import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createUseState } from '~/utils/createUseState';
import {
  createFamilyTreeStore,
  FamilyTreeStore,
  FamilyTreeStoreApi,
} from './store';

const FamilyTreeContext = createContext<FamilyTreeStoreApi | undefined>(
  undefined,
);

export const FamilyTreeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const storeRef = useRef<FamilyTreeStoreApi>();

  storeRef.current ??= createFamilyTreeStore();

  return (
    <FamilyTreeContext.Provider value={storeRef.current}>
      {children}
    </FamilyTreeContext.Provider>
  );
};

export const useFamilyTreeStore = <T,>(
  selector: (state: FamilyTreeStore) => T,
) => {
  const store = useContext(FamilyTreeContext);
  invariant(
    store,
    'useFamilyTreeStore must be used within a FamilyTreeProvider',
  );

  return useStore(store, selector);
};

export const useFamilyTreeState = createUseState(useFamilyTreeStore);
