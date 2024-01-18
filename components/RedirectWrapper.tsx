'use client';

import type { Session } from 'lucia';
import type { Route } from 'next';
import { usePathname, redirect, useSearchParams } from 'next/navigation';
import { useSession } from '~/providers/SessionProvider';
import { calculateRedirect } from '~/utils/calculateRedirectedRoutes';

/**
 *
 * This wrapper component determines if we need to redirect based on if the
 * user is logged in, if the app is configured, and if the configuration window
 * is expired.
 *
 * Initially implemented within the root layout, but this caused maximum update
 * depth exceeded errors for unknown reasons.
 *
 * Logic for redirection is in utils/calculateRedirectedRoutes.ts
 */

export default function RedirectWrapper({
  children,
  configured,
  expired,
}: {
  children: React.ReactNode;
  configured: boolean;
  expired: boolean;
}) {
  const path = usePathname() as Route;
  const searchParams = useSearchParams();
  const { session, isLoading } = useSession();

  if (isLoading) {
    return children;
  }

  const shouldRedirect = calculateRedirect({
    session,
    path,
    searchParams,
    expired,
    configured,
  });

  if (shouldRedirect) {
    redirect(shouldRedirect);
  }

  return children;
}
