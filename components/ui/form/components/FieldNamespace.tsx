'use client';

import { createContext, useContext, type ReactNode } from 'react';

const FieldNamespaceContext = createContext<string>('');

export function useFieldNamespace(): string {
  return useContext(FieldNamespaceContext);
}

type FieldNamespaceProps = {
  prefix: string;
  children: ReactNode;
};

export default function FieldNamespace({
  prefix,
  children,
}: FieldNamespaceProps) {
  const parentNamespace = useFieldNamespace();
  const fullNamespace = parentNamespace
    ? `${parentNamespace}.${prefix}`
    : prefix;

  return (
    <FieldNamespaceContext.Provider value={fullNamespace}>
      {children}
    </FieldNamespaceContext.Provider>
  );
}
