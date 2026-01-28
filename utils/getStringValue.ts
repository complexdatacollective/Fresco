// Convert string | boolean | Date to string
export const getStringValue = (value: string | boolean | Date) => {
  if (typeof value === 'boolean') return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
};
