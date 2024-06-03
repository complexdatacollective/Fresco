import 'server-only';
import { env } from '~/env';

export default function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (env.VERCEL_URL)
    // reference for vercel.com
    return `https://${env.VERCEL_URL}`;

  if (env.PUBLIC_URL)
    // Manually set deployment URL from env
    return env.PUBLIC_URL;

  // eslint-disable-next-line no-console
  console.warn("⚠️ Couldn't determine base URL, using default");
  return `http://localhost:3000`;
}
