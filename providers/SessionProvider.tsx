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

type GetQueryReturn = Session | null;

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
      onSuccess: (data: GetQueryReturn) => {
        if (data) {
          setSession(data);
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
        // As with elsewhere, using the router causes a flash, so we use
        // window.location.replace() instead.

        window.location.replace('/');
        // router.replace('/');
      },
    });

  // If we have an initial session, we don't need to fetch it again.
  useEffect(() => {
    if (initialSession) {
      return;
    }

    getSession().catch((err: { message: string | undefined }) => {
      setSession(null);
      throw new Error(err.message);
    });
  }, [initialSession, getSession]);

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
