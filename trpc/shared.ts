import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { env } from '~/env.mjs';
import type { AppRouter } from '~/server/router';

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
  return `http://127.0.0.1:3000`;
}

export function getUrl() {
  return getBaseUrl() + '/api/trpc';
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
