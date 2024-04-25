import { env } from '~/env.mjs';

export default function getBaseUrl() {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return `${window.location.protocol}//${window.location.host}`;

  if (env.VERCEL_URL)
    // reference for vercel.com
    return `https://${env.VERCEL_URL}`;

  if (env.NEXT_PUBLIC_URL)
    // Manually set deployment URL from env
    return env.NEXT_PUBLIC_URL;

  // assume localhost
  return `http://127.0.0.1:3000`;
}
