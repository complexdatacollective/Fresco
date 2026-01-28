'use client';

import { useContext } from 'react';
import { useStore } from 'zustand';
import {
  type ProtocolImportStore,
  type ProtocolImportStoreApi,
} from './protocolImportStore';
import { ProtocolImportStoreContext } from './ProtocolImportProvider';

export const useProtocolImportStore = <T>(
  selector: (store: ProtocolImportStore) => T,
): T => {
  const storeContext = useContext(ProtocolImportStoreContext);

  if (!storeContext) {
    throw new Error(
      'useProtocolImportStore must be used within ProtocolImportProvider',
    );
  }

  return useStore(storeContext, selector);
};

export const useProtocolImportStoreApi = (): ProtocolImportStoreApi => {
  const storeContext = useContext(ProtocolImportStoreContext);

  if (!storeContext) {
    throw new Error(
      'useProtocolImportStoreApi must be used within ProtocolImportProvider',
    );
  }

  return storeContext;
};
