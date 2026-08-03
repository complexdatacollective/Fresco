/* eslint-disable no-process-env */
export function getBaseUrl() {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return '';

  // Custom deployments use PUBLIC_URL
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;

  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
