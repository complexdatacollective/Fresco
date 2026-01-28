'use client';

import { createContext, useRef, type ReactNode } from 'react';
import ProtocolImportDialog from '~/components/ProtocolImportDialog/ProtocolImportDialog';
import {
  createProtocolImportStore,
  type ProtocolImportStoreApi,
} from './protocolImportStore';

export const ProtocolImportStoreContext = createContext<
  ProtocolImportStoreApi | undefined
>(undefined);

type ProtocolImportProviderProps = {
  children: ReactNode;
};

export default function ProtocolImportProvider({
  children,
}: ProtocolImportProviderProps) {
  const storeRef = useRef<ProtocolImportStoreApi | undefined>(undefined);

  storeRef.current ??= createProtocolImportStore();

  return (
    <ProtocolImportStoreContext.Provider value={storeRef.current}>
      {children}
      <ProtocolImportDialog />
    </ProtocolImportStoreContext.Provider>
  );
}
