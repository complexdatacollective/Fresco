/**
 * Checks that a password contains at least 1 lowercase, 1 uppercase,
 * 1 number, and 1 symbol character, with a minimum length of 8.
 *
 * Replaces the `validator` package's `isStrongPassword` to avoid bundling
 * ~125KB of locale data that was never used.
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
