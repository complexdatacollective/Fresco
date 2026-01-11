/**
 * Composes multiple event handlers into a single handler.
 * The internal handler runs first, then the external handler runs
 * unless the event's default was prevented.
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

    // Only call external if default wasn't prevented
    if (
      !(event as unknown as { defaultPrevented?: boolean }).defaultPrevented
    ) {
      external?.(event);
    }
  };
}
