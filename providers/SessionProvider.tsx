'use client';

import type { Session } from 'lucia';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '~/trpc/client';
import usePrevious from '~/hooks/usePrevious';

type SessionWithLoading = {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<{ success: boolean }>;
};

const SessionContext = createContext<SessionWithLoading | null>(null);

export const useSession = () => {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return session;
};

const compareSessions = (a: Session | null, b: Session | null) => {
  if (a === null && b === null) {
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  return a.sessionId === b.sessionId;
};

export const SessionProvider = ({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  const [session, setSession] = useState<Session | null>(initialSession);

  const previousSession = usePrevious(session);
  const router = useRouter();

  const { refetch: getSession, isFetching: isFetchingSession } =
    api.session.get.useQuery(undefined, {
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      initialData: initialSession,
      onSuccess: (data) => {
        if (compareSessions(session, data)) {
          // Check if the session has changed before updating state, as this
          // will cause a re-render.
          if (session) {
            setSession(data);
          }
        } else {
          setSession(null);
        }
      },
      onError: (error) => {
        throw new Error(error.message);
      },
    });

  const { mutateAsync: signOut, isLoading: isSigningOut } =
    api.session.signOut.useMutation({
      onSuccess: () => {
        setSession(null);
      },
      onError: (error) => {
        throw new Error(error.message);
      },
    });

  // If session changes from Session to null, refresh the router to trigger
  // the redirect to the login page.
  useEffect(() => {
    if (session === null && previousSession !== null) {
      router.refresh();
    }
  }, [session, router, previousSession]);

  const value = useMemo(
    () => ({
      session,
      isLoading: isFetchingSession || isSigningOut,
      signOut,
    }),
    [session, isFetchingSession, isSigningOut, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
