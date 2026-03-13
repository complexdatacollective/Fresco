/**
 * Flattens a complex type definition for improved readability in IDE tooltips.
 * Works by iterating over all properties and forcing a concrete representation.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
