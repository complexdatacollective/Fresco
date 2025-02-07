import { z } from 'zod';

// Constants for repeated values
const validVariableName = /^[a-zA-Z0-9._:-]+$/;

export const validVariableNameSchema = z.string().regex(validVariableName);

export type ValidVariableName = z.infer<typeof validVariableNameSchema>;

// Enums
const componentEnum = z.enum([
  'Boolean',
  'CheckboxGroup',
  'Number',
  'RadioGroup',
  'Text',
  'TextArea',
  'Toggle',
  'ToggleButtonGroup',
  'Slider',
  'VisualAnalogScale',
  'LikertScale',
  'DatePicker',
  'RelativeDatePicker',
]);

const typeEnum = z.enum([
  'boolean',
  'text',
  'number',
  'datetime',
  'ordinal',
  'scalar',
  'categorical',
  'layout',
  'location',
]);

export enum VariableTypeEnum {
  boolean = 'boolean',
  text = 'text',
  number = 'number',
  datetime = 'datetime',
  ordinal = 'ordinal',
  scalar = 'scalar',
  categorical = 'categorical',
  layout = 'layout',
  location = 'location',
}

export type VariableType = z.infer<typeof typeEnum>;

// Validation Schema
export const validationSchema = z
  .object({
    required: z.union([z.boolean(), z.string()]).optional(), // TODO: the function signature for required is (message) => value => string | undefined, but the schema is boolean
    requiredAcceptsNull: z.boolean().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    minValue: z.number().int().optional(),
    maxValue: z.number().int().optional(),
    minSelected: z.number().int().optional(),
    maxSelected: z.number().int().optional(),
    unique: z.boolean().optional(),
    differentFrom: z.string().optional(),
    sameAs: z.string().optional(),
    greaterThanVariable: z.string().optional(),
    lessThanVariable: z.string().optional(),
  })
  .strict();

export type VariableValidation = z.infer<typeof validationSchema>;

const OptionsOptionSchema = z.object({
  label: z.string(),
  value: z.union([
    z.number().int(),
    z.string().regex(validVariableName),
    z.boolean(),
  ]),
  negative: z.boolean().optional(),
});

export type OptionsOption = z.infer<typeof OptionsOptionSchema>;

// Options Schema
const optionsSchema = z
  .array(z.union([OptionsOptionSchema.strict(), z.number().int(), z.string()]))
  .optional();

// Variable Schema
const variableSchema = z
  .object({
    name: z.string().regex(validVariableName),
    type: typeEnum,
    encrypted: z.boolean().optional(),
    component: componentEnum.optional(),
    options: optionsSchema,
    parameters: z
      .object({
        minLabel: z.string().optional(),
        maxLabel: z.string().optional(),
        before: z.number().int().optional(),
        type: z.string().optional(),
        min: z.string().optional(),
      })
      .optional(),
    validation: validationSchema.optional(),
  })
  .strict();

export type VariableDefinition = z.infer<typeof variableSchema>;

export const VariablesSchema = z.record(
  validVariableNameSchema,
  variableSchema,
);
