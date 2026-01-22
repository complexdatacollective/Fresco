/**
 * Type guard to check if a value is a React ChangeEvent.
 * This allows form field onChange handlers to accept either direct values
 * or native browser change events.
 */
export function isChangeEvent(
  value: unknown,
): value is React.ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    typeof (value as Record<string, unknown>).target === 'object' &&
    (value as Record<string, unknown>).target !== null &&
    'value' in (value as { target: Record<string, unknown> }).target
  );
}

/**
 * Extracts the value from either a direct value or a ChangeEvent.
 * If the input is a ChangeEvent, returns target.value.
 * Otherwise, returns the input unchanged.
 */
export function extractValue<T>(
  valueOrEvent:
    | T
    | React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
): T {
  if (isChangeEvent(valueOrEvent)) {
    return valueOrEvent.target.value as T;
  }
  return valueOrEvent;
}
