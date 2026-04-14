// TODO: When @codaco/protocol-validation exports its `VariableOptions` type
// from its public entry, replace this module by importing from there.
// Source of truth: `categoricalOptionsSchema` in
// node_modules/@codaco/protocol-validation/dist/src/schemas/8/variables/variable.d.ts
// — shape: { label: string; value: number | string | boolean }[].

export type VariableOptionValue = string | number | boolean;
export type VariableOption = { label: string; value: VariableOptionValue };
export type VariableOptions = VariableOption[];
