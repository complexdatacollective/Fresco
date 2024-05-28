import { z } from 'zod';

export const participantIdentifierSchema = z
  .string()
  .min(1, { message: 'Identifier cannot be empty' })
  .max(255, { message: 'Identifier too long. Maxiumum of 255 characters.' })
  // Ensure that the identifier is not just whitespace or have leading/trailing spaces
  .refine((identifier) => identifier.trim() === identifier, {
    message: 'Identifier cannot have leading or trailing spaces',
  });

export const participantLabelSchema = z
  .string()
  .optional()
  // If the label is provided, ensure it is not just whitespace
  .refine((label) => !label || label.trim() !== '', {
    message:
      'Label cannot contain only spaces. Enter one or more characters or leave this field empty.',
  });

const participantLabelRequiredSchema = participantLabelSchema.refine(
  (label) => label !== undefined && label.trim() !== '',
  {
    message: 'Label cannot contain only spaces. Enter one or more characters.',
  },
);

const ParticipantRowSchema = z.union([
  z.object({
    identifier: participantIdentifierSchema,
    label: participantLabelSchema,
  }),
  z.object({
    label: participantLabelRequiredSchema,
    identifier: participantIdentifierSchema.optional(),
  }),
]);

export const FormSchema = z.object({
  csvFile: z.array(ParticipantRowSchema, {
    invalid_type_error: 'Invalid CSV',
  }),
});

export type FormSchema = z.infer<typeof FormSchema>;

// Used for import
export const participantListInputSchema = z.array(ParticipantRowSchema);

export const updateSchema = z.object({
  identifier: participantIdentifierSchema,
  data: z.object({
    identifier: participantIdentifierSchema,
    label: participantLabelSchema,
  }),
});
