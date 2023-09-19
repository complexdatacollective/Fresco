'use client';

import type { Session } from 'lucia';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trpc } from '~/app/_trpc/client';

const SessionContext = createContext<Session | undefined>(undefined);

export const useSession = () => {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return session;
};

export const SessionProvider = ({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session?: Session | null | undefined;
}) => {
  const hasInitialSession = initialSession !== undefined;
  const [session, setSession] = useState<Session | null | undefined>(
    initialSession,
  );
  const [loading, setLoading] = useState(!!hasInitialSession);

  const { refetch: getSession } = trpc.getSession.useQuery(undefined, {
    initialData: initialSession,
    onSuccess: (data) => {
      console.log('use query', data);
      setSession(data);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // Revalidate session on mount
  useEffect(() => {
    if (hasInitialSession) {
      async function doStuff() {
        await getSession();
      }

      doStuff().catch((err) => {
        console.error(err);
      });
    }
  }, [hasInitialSession, getSession]);

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
