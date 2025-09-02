import { z } from 'zod';

// Utility function to check for non-whitespace characters
const hasNonWhitespaceCharacters = (input: string | undefined) =>
  input && input.length > 0;

export const participantIdentifierSchema = z
  .string()
  .min(1, { error: 'Identifier cannot be empty' })
  .max(255, { error: 'Identifier too long. Maximum of 255 characters.' })
  .trim()
  .refine(hasNonWhitespaceCharacters, {
    error: 'Identifier requires one or more non-whitespace characters.',
  });

export const participantIdentifierOptionalSchema = z
  .string()
  .max(255, {
    error: 'Identifier too long. Maximum of 255 characters.',
  })
  .trim()
  .transform((e) => (e === '' ? undefined : e))
  .optional();

export const participantLabelSchema = z
  .string()
  .trim()
  .transform((e) => (e === '' ? undefined : e))
  .optional();

export const participantLabelRequiredSchema = z
  .string()
  .trim()
  .refine(hasNonWhitespaceCharacters, {
    error: 'Label requires one or more non-whitespace characters.',
  });

export const ParticipantRowSchema = z.union([
  z.object({
    identifier: participantIdentifierSchema,
    label: participantLabelSchema,
  }),
  z.object({
    label: participantLabelRequiredSchema,
    identifier: participantIdentifierOptionalSchema,
  }),
]);

export const FormSchema = z.object({
  csvFile: z.array(ParticipantRowSchema, {
    error: 'Invalid CSV',
  }),
});

export type FormSchema = z.infer<typeof FormSchema>;

// Used for import
export const participantListInputSchema = z.array(ParticipantRowSchema);

export const updateSchema = z.object({
  identifier: participantIdentifierSchema,
  label: participantLabelSchema,
});
