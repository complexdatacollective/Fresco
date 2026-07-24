import { env } from '~/env';
import { captureException } from '~/lib/posthog-server';

/**
 * Safely parse a JSON field read from the database with a Zod schema. On
 * failure the parse error is surfaced for observability — logged in
 * development, captured to PostHog in production — and the caller's `fallback`
 * is returned.
 *
 * It deliberately does NOT throw: a single malformed row must not take down an
 * entire page (e.g. crash the dashboard because one protocol carries a legacy
 * field shape). Callers must therefore be able to cope with the fallback value.
 */
export function safeParseField<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: unknown;
    };
  },
  data: unknown,
  fieldName: string,
  fallback: T,
): T {
  const result = schema.safeParse(data);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  const parseError = result.error;

  if (env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[Prisma] Failed to parse "${fieldName}" field:`, parseError);
    return fallback;
  }

  void captureException(parseError, {
    context: `prisma.result.${fieldName}`,
  });

  return fallback;
}
