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

  const { refetch: getSession, isLoading } = trpc.session.get.useQuery(
    undefined,
    {
      initialData: { session: initialSession },
      onSuccess: (data: GetQueryReturn) => {
        if (data) {
          setSession(data);
        } else {
          setSession(null);
        }
      },
    },
  );

  // If initialSession is updated, update the session state and refetch
  // client side.
  useEffect(() => {
    console.log('initial session changed', initialSession);
    setSession(initialSession);
    getSession().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  }, [initialSession, getSession]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
    }),
    [session, isLoading],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
