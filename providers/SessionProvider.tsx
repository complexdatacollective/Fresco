'use client';

import type { Session } from 'lucia';
import { useHydrateAtoms } from 'jotai/utils';
import { Provider, atom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { isEqual } from 'lodash';
import { useRouter } from 'next/navigation';

export const sessionAtom = atom<Session | null>(null);
export const isLoadingAtom = atom(false);

const sessionsAreEqual = (a: Session | null, b: Session | null) =>
  isEqual(a, b);

const HydrationWrapper = ({
  initialSession,
}: {
  initialSession: Session | null;
}) => {
  useHydrateAtoms([[sessionAtom, initialSession]]);
  // const router = useRouter();

  // const currentSession = useAtomValue(sessionAtom);
  // const setSession = useSetAtom(sessionAtom);
  // const setIsLoading = useSetAtom(isLoadingAtom);

  return null;
};

export default function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <HydrationWrapper initialSession={initialSession} />
      {children}
    </Provider>
  );
}
