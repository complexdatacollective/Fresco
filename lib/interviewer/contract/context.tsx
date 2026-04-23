'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type {
  AssetRequestHandler,
  FinishHandler,
  InterviewerFlags,
} from '~/lib/interviewer/contract/types';

type ContractHandlers = {
  onFinish: FinishHandler;
  onRequestAsset: AssetRequestHandler;
};

type ContractValue = {
  handlers: ContractHandlers;
  flags: Required<InterviewerFlags>;
};

const ContractContext = createContext<ContractValue | null>(null);

type ContractProviderProps = {
  onFinish: FinishHandler;
  onRequestAsset: AssetRequestHandler;
  flags?: InterviewerFlags;
  children: ReactNode;
};

export function ContractProvider({
  onFinish,
  onRequestAsset,
  flags,
  children,
}: ContractProviderProps) {
  const value = useMemo<ContractValue>(
    () => ({
      handlers: { onFinish, onRequestAsset },
      flags: { isE2E: flags?.isE2E ?? false },
    }),
    [onFinish, onRequestAsset, flags?.isE2E],
  );

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

function useContract(): ContractValue {
  const value = useContext(ContractContext);
  if (!value) {
    throw new Error(
      'useContractHandlers / useContractFlags must be used within a ContractProvider',
    );
  }
  return value;
}

export function useContractHandlers(): ContractHandlers {
  return useContract().handlers;
}

export function useContractFlags(): Required<InterviewerFlags> {
  return useContract().flags;
}
