export function extractFormFieldAttributes(
  values: Record<string, unknown>,
  prefix: string,
  index: number,
  formFields: { variable: string; prompt: string }[],
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const field of formFields) {
    const key = `${prefix}-${index}-${field.variable}`;
    if (values[key] !== undefined) {
      attrs[field.variable] = values[key];
    }
  }
  return attrs;
}
