import { env } from '~/env.mjs';

export function getBaseUrl() {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return '';

  if (env.VERCEL_URL)
    // reference for vercel.com
    return `https://${env.VERCEL_URL}`;

  if (env.NEXT_PUBLIC_URL)
    // Manually set deployment URL from env
    return env.NEXT_PUBLIC_URL;

  // assume localhost
  return `http://localhost:3000`;
}
