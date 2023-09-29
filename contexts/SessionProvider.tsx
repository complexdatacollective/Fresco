'use client';

import type { Session } from 'lucia';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trpcReact } from '~/app/_trpc/client';

type SessionWithLoading = {
  session: Session | null;
  isLoading: boolean;
};

const SessionContext = createContext<SessionWithLoading | null>(null);

export const useSession = () => {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return session;
};

type GetQueryReturn = Session | null;

export const SessionProvider = ({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);

  const { data: freshSession, refetch: getSession } =
    trpcReact.session.get.useQuery(undefined, {
      refetchOnMount: true,
    });

  useEffect(() => {
    console.log('freshSession', freshSession);
    if (!freshSession) return;

    setSession(freshSession);
  }, [freshSession]);

  // Revalidate session on mount
  useEffect(() => {
    console.log('initialSession', initialSession);
    if (initialSession) {
      setLoading(true);
      getSession().catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });

      setLoading(false);
    }
  }, [initialSession, getSession]);

  const value = useMemo(
    () => ({
      session,
      isLoading: loading,
    }),
    [session, loading],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
