import { redirect } from 'next/navigation';
import 'server-only';
import { env } from '~/env';

/**
 * Redirects to settings page if in preview mode.
 * Use this in dashboard pages that should not be accessible in preview mode.
 */
export function requireNonPreviewMode() {
  if (env.PREVIEW_MODE) {
    redirect('/dashboard/settings');
  }
}
