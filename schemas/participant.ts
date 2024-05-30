import { z } from 'zod';

// Utility function to check for non-whitespace characters
const hasNonWhitespaceCharacters = (input: string | undefined) =>
  input && input.length > 0;

export const participantIdentifierSchema = z
  .string()
  .min(1, { message: 'Identifier cannot be empty' })
  .max(255, { message: 'Identifier too long. Maximum of 255 characters.' })
  .trim()
  .refine(hasNonWhitespaceCharacters, {
    message: 'Identifier requires one or more non-whitespace characters.',
  });

export const participantIdentifierOptionalSchema = z
  .string()
  .max(255, {
    message: 'Identifier too long. Maximum of 255 characters.',
  })
  .trim()
  .optional();

export const participantLabelSchema = z.string().trim().optional();

export const participantLabelRequiredSchema = z
  .string()
  .trim()
  .refine(hasNonWhitespaceCharacters, {
    message: 'Label requires one or more non-whitespace characters.',
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
