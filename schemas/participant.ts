import { z } from 'zod';

// Utility function to check for non-whitespace characters
const hasNonWhitespaceCharacters = (input: string | undefined) =>
  input ? input.trim() !== '' : true;

export const participantIdentifierSchema = z
  .string()
  .trim()
  .min(1, { message: 'Identifier cannot be empty' })
  .max(255, { message: 'Identifier too long. Maximum of 255 characters.' })
  .refine(hasNonWhitespaceCharacters, {
    message: 'Identifier requires one or more non-whitespace characters.',
  });

const participantIdentifierOptionalSchema = z
  .string()
  .trim()
  .max(255, {
    message: 'Identifier too long. Maximum of 255 characters.',
  })
  .optional()
  .refine(hasNonWhitespaceCharacters, {
    message: 'Identifier requires one or more non-whitespace characters.',
  });

export const participantLabelSchema = z
  .string()
  .optional()
  .refine(hasNonWhitespaceCharacters, {
    message:
      'Label cannot contain only spaces. Enter one or more characters or leave this field empty.',
  });

const participantLabelRequiredSchema = z
  .string()
  .refine(hasNonWhitespaceCharacters, {
    message: 'Label cannot contain only spaces. Enter one or more characters.',
  });

const ParticipantRowSchema = z.union([
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
