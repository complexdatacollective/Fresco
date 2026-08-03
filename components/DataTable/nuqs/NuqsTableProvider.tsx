'use client';

import {
  createContext,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from 'react';

/**
 * Shared context for URL-driven server-fetched tables.
 *
 * Provides a single `useTransition` so every filter / pagination / sort
 * control that writes to the URL funnels through one concurrent render,
 * letting the table body fade consistently while fresh data is fetched.
 *
 * Tables that want URL param namespacing (so multiple instances can coexist
 * on the same page) pass a `prefix` — filter components then map their
 * logical param name (`q`, `type`, `page`, …) to `${prefix}_${name}` in the
 * URL, while programmatic state keeps the short name.
 */
type NuqsTableContextValue = {
  prefix: string;
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

const NuqsTableContext = createContext<NuqsTableContextValue | null>(null);

export function useNuqsTable(): NuqsTableContextValue {
  const ctx = useContext(NuqsTableContext);
  if (!ctx) {
    throw new Error('useNuqsTable must be used within a <NuqsTableProvider>');
  }
  return ctx;
}

/**
 * Resolve a logical param name to its URL key given a namespace prefix.
 * Exported so row components that read state directly with nuqs hooks can
 * stay in sync with the namespace their parent provider uses.
 */
export function nuqsTableUrlKey(prefix: string, paramKey: string): string {
  return prefix ? `${prefix}_${paramKey}` : paramKey;
}

type NuqsTableProviderProps = {
  prefix?: string;
  children: ReactNode;
};

export function NuqsTableProvider({
  prefix = '',
  children,
}: NuqsTableProviderProps) {
  const [isPending, startTransition] = useTransition();
  const value = useMemo(
    () => ({ prefix, isPending, startTransition }),
    [prefix, isPending],
  );
  return (
    <NuqsTableContext.Provider value={value}>
      {children}
    </NuqsTableContext.Provider>
  );
}
