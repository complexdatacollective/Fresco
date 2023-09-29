'use client';

import type { Session } from 'lucia';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { calculateRedirect } from '~/utils/calculateRedirectedRoutes';

/**
 *
 * This wrapper component determines if we need to redirect based on if the
 * user is logged in, if the app is configured, and if the confiiuration window
 * is expired.
 *
 * Initially implemented within the root layout, but this caused maximum update
 * depth exceeded errors for unknown reasons.
 *
 * Logic for redirection is in utils/calculateRedirectedRoutes.ts
 */

export default function RedirectWrapper({
  session,
  children,
  configured,
  expired,
}: {
  session: Session | null;
  children: React.ReactNode;
  configured: boolean;
  expired: boolean;
}) {
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const redirect = calculateRedirect({
      session,
      path,
      expired,
      configured,
    });

    if (redirect) {
      router.push(redirect);
    }
  }, [session, path, router, configured, expired]);

  return children;
}
