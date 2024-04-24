import { type ReactElement } from 'react';
import SessionProvider from '~/providers/SessionProvider';
import type { Session } from 'lucia';

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}): ReactElement {
  return (
    <SessionProvider initialSession={initialSession}>
      {children}
    </SessionProvider>
  );
}
