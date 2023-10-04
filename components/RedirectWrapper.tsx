'use client';

import type { Session } from 'lucia';
import type { Route } from 'next';
import { usePathname, redirect } from 'next/navigation';
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
  const path = usePathname() as Route;

  const shouldRedirect = calculateRedirect({
    session,
    path,
    expired,
    configured,
  });

  if (shouldRedirect) {
    console.log('redirecting', shouldRedirect);
    redirect(shouldRedirect);
  }

  return children;
}
