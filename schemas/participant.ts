import { z } from 'zod/mini';

// Utility function to check for non-whitespace characters
const hasNonWhitespaceCharacters = (input: string | undefined) =>
  input && input.length > 0;

export const participantIdentifierSchema = z
  .string()
  .check(z.minLength(1, 'Identifier cannot be empty'))
  .check(z.maxLength(255, 'Identifier too long. Maximum of 255 characters.'))
  .check(z.trim())
  .check(
    z.refine(
      hasNonWhitespaceCharacters,
      'Identifier requires one or more non-whitespace characters.',
    ),
  );

export const participantIdentifierOptionalSchema = z.optional(
  z.pipe(
    z
      .string()
      .check(
        z.maxLength(255, 'Identifier too long. Maximum of 255 characters.'),
      )
      .check(z.trim()),
    z.transform((e) => (e === '' ? undefined : e)),
  ),
);

export const participantLabelSchema = z.optional(
  z.pipe(
    z.string().check(z.trim()),
    z.transform((e) => (e === '' ? undefined : e)),
  ),
);

export const participantLabelRequiredSchema = z
  .string()
  .check(z.trim())
  .check(
    z.refine(
      hasNonWhitespaceCharacters,
      'Label requires one or more non-whitespace characters.',
    ),
  );

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
    message: 'Invalid CSV',
  }),
});

export type FormSchema = z.infer<typeof FormSchema>;

// Used for import
export const participantListInputSchema = z.array(ParticipantRowSchema);

export const updateSchema = z.object({
  existingIdentifier: participantIdentifierSchema,
  formData: z.object({
    identifier: participantIdentifierSchema,
    label: participantLabelSchema,
  }),
});

// CSV validation schemas used by DropzoneField
const csvRowSchema = z.object({
  label: z.optional(z.string()),
  identifier: z.optional(z.string()),
});

export const csvDataSchema = z
  .array(csvRowSchema)
  .check(
    z.refine(
      (rows) =>
        rows.every(
          (row) =>
            (row.label !== undefined && row.label !== '') ||
            row.identifier !== undefined,
        ),
      'Invalid CSV. Every row must have either a label or an identifier',
    ),
  );
