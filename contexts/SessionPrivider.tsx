'use client';

import type { Session } from 'lucia';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trpc } from '~/app/_trpc/client';

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

  const { refetch: getSession } = trpc.session.get.useQuery(undefined, {
    initialData: { session: initialSession },
    // refetchOnMount: false,
    onSuccess: (data: GetQueryReturn) => {
      if (!data) {
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(data);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // Revalidate session on mount
  useEffect(() => {
    if (initialSession) {
      setLoading(true);
      getSession().catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
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
