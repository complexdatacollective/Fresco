/**
 * Composes multiple event handlers into a single handler.
 * Both handlers always run regardless of whether one prevents default.
 *
 * @param internal - The internal/default handler
 * @param external - The external/user-provided handler
 * @returns A composed handler that calls both in sequence
 */
export function composeEventHandlers<E>(
  internal?: (event: E) => void,
  external?: (event: E) => void,
): ((event: E) => void) | undefined {
  if (!internal && !external) return undefined;

  return (event: E) => {
    internal?.(event);
    external?.(event);
  };
}
