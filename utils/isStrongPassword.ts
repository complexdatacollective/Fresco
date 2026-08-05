/**
 * The single definition of what makes a password strong enough for this app:
 * at least 8 characters, with at least 1 lowercase, 1 uppercase, 1 number and
 * 1 symbol.
 *
 * The rule lives here as data rather than as a schema because it has to be
 * enforced on both sides of the server boundary in two different zod flavours:
 * `schemas/` is `server-only` and uses standard zod, while client-reachable
 * code must import from `zod/mini` for bundle size. Sharing the parts — rather
 * than a schema object — is what stops the two from drifting.
 *
 * `isStrongPassword` replaces the `validator` package's function of the same
 * name, which bundled ~125KB of locale data that was never used.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

export const PASSWORD_CHARACTER_RULES = [
  {
    pattern: /[a-z]/,
    message: 'Password must contain at least 1 lowercase letter',
  },
  {
    pattern: /[A-Z]/,
    message: 'Password must contain at least 1 uppercase letter',
  },
  { pattern: /\d/, message: 'Password must contain at least 1 number' },
  {
    pattern: /[^A-Za-z0-9]/,
    message: 'Password must contain at least 1 symbol',
  },
] as const;

/**
 * The combined message, for the server-side parses that report a single error
 * rather than one per unmet rule (the client has already reported them
 * individually by then).
 */
export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol';

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_CHARACTER_RULES.every(({ pattern }) => pattern.test(password))
  );
}
