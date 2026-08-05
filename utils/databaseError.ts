export class DatabaseError extends Error {
  readonly originalError: Error;

  // Written as an explicit field rather than a constructor parameter property:
  // the shared tsconfig sets `erasableSyntaxOnly`, which forbids the shorthand.
  constructor(message: string, originalError: Error) {
    super(message);
    this.originalError = originalError;
  }
}
